# Cut every part of the user's 2D parts sheet into its own transparent PNG (from the ×4 upscale), keeping the
# painted texture and outline. Boxes are measured on the ORIGINAL 1448 × 1086 sheet. Writes parts/<name>.png and
# parts/parts.json {name: {sheet_box, size, scale}}.   usage: python cutparts.py [name …]
import sys, os, json, numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

S = 4  # upscale factor of src/parts_sheet_x4.png
BOX = {
  # ---- male (男主拆件)
  'm_head_base': (262, 402, 372, 522), 'm_hair_front': (372, 392, 494, 508), 'm_hair_back': (502, 392, 632, 508),
  'm_eye_normal_L': (696, 410, 747, 450), 'm_eye_normal_R': (747, 410, 798, 450),
  'm_eye_smile_L': (696, 450, 747, 474), 'm_eye_smile_R': (747, 450, 798, 474),
  'm_eye_tear_L': (696, 474, 747, 512), 'm_eye_tear_R': (747, 474, 798, 512),
  'm_mouths': (810, 395, 856, 505),
  'm_hand_phone': (893, 396, 958, 446), 'm_hand_open': (965, 396, 1033, 447), 'm_hand_relax': (1036, 396, 1101, 447),
  'm_hand_bouquet': (897, 440, 996, 505), 'm_hand_fist': (1003, 446, 1050, 505), 'm_hand_grip': (1047, 446, 1096, 505),
  'm_sleeve_upper': (1106, 392, 1166, 457), 'm_sleeve_fore': (1190, 392, 1254, 457),
  'm_arm_upper': (1096, 478, 1167, 532), 'm_arm_fore': (1176, 478, 1254, 532),
  'm_torso_tee': (80, 550, 199, 646), 'm_torso_hoodie': (199, 550, 323, 646), 'm_torso_tee_cam': (323, 550, 436, 646),
  'm_lower_shorts_beige': (468, 553, 551, 646), 'm_lower_dark': (551, 553, 637, 646),
  'm_thigh_L': (644, 568, 697, 646), 'm_thigh_R': (697, 568, 752, 646), 'm_shin_L': (773, 568, 818, 646), 'm_shin_R': (818, 568, 870, 646),
  'm_shoe_white_L': (884, 588, 938, 632), 'm_shoe_white_R': (938, 588, 991, 632), 'm_shoe_dark_L': (990, 588, 1039, 632), 'm_shoe_dark_R': (1039, 588, 1087, 632),
  'm_glasses': (1110, 578, 1247, 630), 'm_ref_bust': (95, 345, 255, 508),
  # ---- female (女主拆件)
  'f_head_base': (292, 698, 392, 818), 'f_hair_front': (402, 692, 518, 805), 'f_hair_back': (532, 688, 662, 822),
  'f_eye_normal_L': (745, 700, 796, 738), 'f_eye_normal_R': (796, 700, 846, 738),
  'f_eye_smile_L': (745, 738, 796, 765), 'f_eye_smile_R': (796, 738, 846, 765),
  'f_eye_tear_L': (745, 765, 796, 802), 'f_eye_tear_R': (796, 765, 846, 802),
  'f_mouths': (852, 692, 898, 805),
  'f_hand_phone': (928, 690, 996, 742), 'f_hand_open': (998, 690, 1062, 742), 'f_hand_clap': (1065, 688, 1122, 748), 'f_hand_bouquet': (1124, 688, 1208, 782),
  'f_hand_fist_a': (932, 752, 1002, 812), 'f_hand_fist_b': (1012, 752, 1076, 812),
  'f_sleeve_upper': (1250, 686, 1318, 742), 'f_sleeve_fore': (1350, 686, 1414, 742), 'f_arm_upper': (1240, 770, 1308, 818), 'f_arm_fore': (1350, 770, 1414, 818),
  'f_torso_tee': (82, 850, 188, 935), 'f_torso_coat': (190, 845, 318, 935), 'f_torso_sailor': (318, 850, 424, 935),
  'f_lower_shorts': (436, 850, 507, 930), 'f_lower_dark': (507, 850, 576, 930), 'f_lower_skirt': (573, 850, 655, 930),
  'f_thigh_L': (662, 855, 710, 935), 'f_thigh_R': (712, 855, 762, 935), 'f_shin_L': (776, 855, 818, 935), 'f_shin_R': (820, 855, 864, 935),
  'f_shoe_pink_L': (872, 865, 926, 928), 'f_shoe_pink_R': (926, 865, 978, 928), 'f_shoe_brown_L': (978, 865, 1027, 928), 'f_shoe_brown_R': (1027, 865, 1078, 928),
  'f_ref_bust': (95, 650, 255, 815),
  # ---- shared props
  'p_phone': (172, 968, 240, 1040), 'p_helmet': (262, 960, 360, 1042), 'p_moto': (382, 960, 545, 1042), 'p_bouquet': (560, 960, 680, 1045), 'p_scarf': (700, 960, 812, 1042), 'p_drink': (828, 960, 896, 1042),
}
SPLIT = {'m_mouths', 'f_mouths'}   # several mouths in one box: save each component separately, top to bottom

def matte(rgb):
    # everything that is not the beige paper: colour distance from the paper (estimated on the crop border),
    # or dark line art; small gaps in the line art closed, enclosed highlights filled, paper specks dropped
    f = cv2.GaussianBlur(rgb.astype(np.float32), (0, 0), 2.2)
    border = np.concatenate([f[:6].reshape(-1, 3), f[-6:].reshape(-1, 3), f[:, :6].reshape(-1, 3), f[:, -6:].reshape(-1, 3)])
    paper = np.median(border, 0); dist = np.linalg.norm(f - paper, axis=2); luma = f.mean(2)
    m = (dist > 24) | (luma < 205)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    m = ndi.binary_fill_holes(m).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))       # keep the antialiased outline
    return (m * 255).astype(np.uint8)

def peel(rgb, a):
    # remove the leftover white sticker border: near-white pixels connected to the outside of the part
    f = rgb.astype(np.float32); mx, mn = f.max(2), f.min(2); white = (mx > 236) & ((mx - mn) < 22)
    m = a > 0; cand = (white & m) | ~m
    lab_n, lab = cv2.connectedComponents(cand.astype(np.uint8), connectivity=4)
    outside = np.setdiff1d(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]), [0]); rim = np.isin(lab, outside) & m
    a = np.where(rim, 0, a).astype(np.uint8)
    a = cv2.morphologyEx(a, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    return a

def main(names):
    sheet = Image.open('src/parts_sheet_x4.png').convert('RGB')
    meta = json.load(open('parts/parts.json')) if os.path.exists('parts/parts.json') else {}
    for n in names:
        x0, y0, x1, y1 = BOX[n]; crop = sheet.crop((x0 * S, y0 * S, x1 * S, y1 * S))
        a = matte(np.asarray(crop))
        if 'glasses' in n:   # lenses must be see-through: keep only the dark frame
            g = cv2.GaussianBlur(np.asarray(crop).astype(np.float32), (0, 0), 1).mean(2)
            a = np.where(g < 150, 255, 0).astype(np.uint8); a = cv2.dilate(a, np.ones((3, 3), np.uint8))
        elif not any(w in n for w in ('shoe_white', 'shoe_pink', 'f_torso_tee', 'f_sleeve', 'p_helmet', 'm_sleeve')): a = peel(np.asarray(crop), a)   # white sneakers keep their white
        lab_n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 40).astype(np.uint8), 8)
        if lab_n <= 1: print('!! nothing found', n); continue
        areas = stats[1:, cv2.CC_STAT_AREA]; big = areas.max()
        H_, W_ = a.shape; li = int(np.argmax(areas)) + 1
        def edge(i): x, y, w, h = stats[i, :4]; return x <= 1 or y <= 1 or x + w >= W_ - 1 or y + h >= H_ - 1
        keep = [i + 1 for i, ar in enumerate(areas) if (i + 1 == li or not edge(i + 1)) and ar > big * (.15 if n in SPLIT else .06)]
        groups = [[i] for i in sorted(keep, key=lambda i: stats[i, cv2.CC_STAT_TOP])] if n in SPLIT else [keep]
        for gi, g in enumerate(groups):
            m = np.isin(lab, g); al = np.where(m, a, 0).astype(np.uint8)
            al = cv2.GaussianBlur(al, (0, 0), .8)
            ys, xs = np.where(al > 8); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            rgba = np.dstack([np.asarray(crop), al])[by0:by1, bx0:bx1]
            name = f'{n[:-1]}_{gi + 1}' if n in SPLIT else n
            Image.fromarray(rgba, 'RGBA').save(f'parts/{name}.png')
            meta[name] = {'sheet_box': [x0 + bx0 / S, y0 + by0 / S, x0 + bx1 / S, y0 + by1 / S], 'size': [int(bx1 - bx0), int(by1 - by0)], 'scale': S}
            print(f'{name:22s} {bx1 - bx0:5d}×{by1 - by0:<5d}')
    json.dump(meta, open('parts/parts.json', 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main(sys.argv[1:] or list(BOX))
