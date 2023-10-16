import json
import copy


def is_bridge(street):
    if street["properties"]["bridge"] != None:
        return True
    return False


with open("streets_shape_original.geojson") as file:
    with open("out.json") as ref:
        ref_data = json.load(ref)

        data = json.load(file)["features"]

        out_names = []
        out = {}

        for street in data:
            name = street["properties"]["name"]
            if name != None and name in ref_data and not is_bridge(street):
                if name in out:
                    out_street = {
                        "name": name,
                        "lat": ref_data[name]["lat"],
                        "lon": ref_data[name]["lon"],
                        "path": street["geometry"]["coordinates"],
                    }

                    out[name].append(out_street)
                else:
                    out_street = {
                        "name": name,
                        "lat": ref_data[name]["lat"],
                        "lon": ref_data[name]["lon"],
                        "path": street["geometry"]["coordinates"],
                    }

                    out[name] = [out_street]

json_obj = json.dumps(out, indent=True, ensure_ascii=False)
with open("out_with_shape.json", "w") as out:
    out.write(json_obj)
