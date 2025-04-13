import os
import cv2
import numpy as np
import random

# Création des dossiers
def create_directories(base_dir='data', classes=range(7)):  # seulement 0-6
    for split in ['train', 'test']:
        for i in classes:
            path = os.path.join(base_dir, split, str(i))
            os.makedirs(path, exist_ok=True)

# Dessin d'une moitié de domino
def draw_domino_half(value, size=100):
    img = np.ones((size, size, 3), dtype=np.uint8) * 255
    center = (size // 2, size // 2)
    radius = size // 12
    spacing = size // 4

    positions = {
        1: [(0, 0)],
        2: [(-1, -1), (1, 1)],
        3: [(-1, -1), (0, 0), (1, 1)],
        4: [(-1, -1), (-1, 1), (1, -1), (1, 1)],
        5: [(-1, -1), (-1, 1), (0, 0), (1, -1), (1, 1)],
        6: [(-1, -1), (-1, 0), (-1, 1), (1, -1), (1, 0), (1, 1)],
    }

    coords = []
    if value == 0:
        coords = []
    elif value <= 6:
        coords = positions[value]
    else:
        raise ValueError(f"Impossible de dessiner une moitié de domino avec {value} points (maximum 6).")

    for dx, dy in coords:
        x = center[0] + dx * spacing
        y = center[1] + dy * spacing
        cv2.circle(img, (x, y), radius, (0, 0, 0), -1)

    return img

# Générer et enregistrer les images
def generate_dataset(images_per_class=100, base_dir='data'):
    for value in range(7):  # de 0 à 6, pas 10 !
        for i in range(images_per_class):
            img = draw_domino_half(value)
            split = 'train' if i < int(images_per_class * 0.8) else 'test'
            filename = os.path.join(base_dir, split, str(value), f'{value}_{i}.png')
            cv2.imwrite(filename, img)

if __name__ == "__main__":
    create_directories()
    generate_dataset(images_per_class=100)
    print("🎉 Dataset généré avec succès dans le dossier 'data'")
