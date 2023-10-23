import json
import math


def is_bridge(street):
    if street["properties"]["bridge"] != None:
        return True
    return False


def get_distance(a, b):
    return math.sqrt(abs(b[0] - a[0]) ** 2 + abs(b[1] - a[1]) ** 2)


def is_inside(verts, test):
    c = False
    nvert = len(verts)

    for i in range(nvert):
        j = i - 1 if i > 0 else nvert - 1
        if ((verts[i][1] > test[1]) != (verts[j][1] > test[1])) and (
            test[0]
            < (verts[j][0] - verts[i][0])
            * (test[1] - verts[i][1])
            / (verts[j][1] - verts[i][1])
            + verts[i][0]
        ):
            c = not c
    return c


center = (50.061708366902316, 19.937352065162212)

city = input("wpisz nazwe miasta\n")

with open(f"{city}_boundry.geojson") as boundry_file:
    boundry_polygon = [
        coord[::-1]
        for coord in json.load(boundry_file)["features"][0]["geometry"]["coordinates"][
            0
        ]
    ]

    with open(f"{city}_in_streets.geojson") as file:
        data = json.load(file)["features"]

        out_names = []
        out = {}

        max_dist = 0

        for street in data:
            name = street["properties"]["name"]
            points = [coord[::-1] for coord in street["geometry"]["coordinates"]]
            if name != None and not is_bridge(street):
                if is_inside(boundry_polygon, points[0]):
                    dist = get_distance(
                        center,
                        [float(x) for x in points[0]],
                    )
                    max_dist = max(dist, max_dist)

                    out_street = {
                        "name": name,
                        "path": [coord[::-1] for coord in points],
                        "dist": dist,
                    }

                    if name in out:
                        out[name].append(out_street)
                    else:
                        out[name] = [out_street]
                else:
                    print("street not in boundry")

print(max_dist)
json_obj = json.dumps(out, indent=True, ensure_ascii=False)
with open(f"{city}_streets.json", "w") as out:
    out.write(json_obj)

PENALTY = 0.9
weights = {}
with open(f"{city}_streets.json") as file:
    streets = json.load(file)

    for street in streets:
        weights[street] = max_dist - streets[street][0]["dist"] * PENALTY

json_obj = json.dumps(weights, indent=True, ensure_ascii=False)
with open(f"{city}_weights.json", "w") as out:
    out.write(json_obj)
