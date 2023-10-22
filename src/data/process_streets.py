import json
import math


def is_bridge(street):
    if street["properties"]["bridge"] != None:
        return True
    return False


def get_distance(a, b):
    return math.sqrt(abs(b[0] - a[0]) ** 2 + abs(b[1] - a[1]) ** 2)


center = (50.061740421308464, 19.93741877127878)


with open("new_streets.geojson") as file:
    with open("out.json") as ref:
        ref_data = json.load(ref)

        data = json.load(file)["features"]

        out_names = []
        out = {}

        for street in data:
            name = street["properties"]["name"]
            if name != None and name in ref_data and not is_bridge(street):
                # dist = get_distance(
                #     center,
                #     [float(x) for x in street["geometry"]["coordinates"][0]][::-1],
                # )

                out_street = {
                    "name": name,
                    "lat": ref_data[name]["lat"],
                    "lon": ref_data[name]["lon"],
                    "path": street["geometry"]["coordinates"],
                }

                if name in out:
                    # if (
                    #     get_distance(
                    #         (float(out_street["lat"]), float(out_street["lon"])),
                    #         [float(x) for x in street["geometry"]["coordinates"][0]][
                    #             ::-1
                    #         ],
                    #     )
                    #     < 0.04
                    # ):
                    out[name].append(out_street)
                    # else:
                    #     print("dist to large, not the same street", dist)
                else:
                    out[name] = [out_street]

json_obj = json.dumps(out, indent=True, ensure_ascii=False)
with open("out_with_shape.json", "w") as out:
    out.write(json_obj)
