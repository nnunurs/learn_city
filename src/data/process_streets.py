import json
import math

"""how to get data
1.    get area code of the city with area[name="{city_name}"]
2.      area({area_code});
        rel(area)["boundary"="administrative"];
        out geom;
3. find relation id with the above code
4. find city outline with rel({relation_if})"""

global center
center = {
    "krakow": (50.06168144356519, 19.937328289497746),
    "zakopane": (49.29389943354241, 19.95370589727813),
}

global black_list
black_list = [
    "Antresola",
    "Schody z filmu Lista Schindlera",
    "Skrót Drużyny Pierścienia",
    "ramp",
]


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


def get_boundary_polygon():
    with open(f"{city}_boundary.geojson") as boundry_file:
        return [
            coord[::-1]
            for coord in json.load(boundry_file)["features"][0]["geometry"][
                "coordinates"
            ][0]
        ]


def process_data(city):
    boundary_polygon = get_boundary_polygon()

    with open(f"{city}_in_streets.geojson") as file:
        data = json.load(file)["features"]
        out = {}

        for street in data:
            name = street["properties"]["name"]
            points = [point[::-1] for point in street["geometry"]["coordinates"]]
            if name != None and name not in black_list:
                if is_inside(boundary_polygon, points[0]):
                    out_street = {
                        "name": name,
                        "path": [point[::-1] for point in points],
                    }

                    if name in out:
                        out[name].append(out_street)
                    else:
                        out[name] = [out_street]
                else:
                    print(f"{name} street not in boundry")

    json_obj = json.dumps(out, indent=True, ensure_ascii=False)
    with open(f"{city}_streets.json", "w") as out:
        out.write(json_obj)


def generate_divisions(city):
    with open(f"{city}_divisions_in.json") as divs_file:
        divs = json.load(divs_file)["features"]

        with open(f"{city}_streets.json") as streets_file:
            streets = json.load(streets_file)

            div_out = {}

            for div in divs:
                if "relation" in div["properties"]["@id"]:
                    div_name = div["properties"]["name"].lower().replace(" ", "_")
                    # print(div_name)
                    for street_main in streets:
                        for street in streets[street_main]:
                            # print(street)
                            poly = div["geometry"]["coordinates"][0]
                            if any(
                                [
                                    is_inside(
                                        poly,
                                        point,
                                    )
                                    for point in street["path"]
                                ]
                            ):
                                print(street["name"])
                                if div_name in div_out:
                                    if not street_main in div_out[div_name]:
                                        div_out[div_name][street_main] = streets[
                                            street_main
                                        ]
                                else:
                                    div_out[div_name] = {
                                        street_main: streets[street_main]
                                    }
                                break

            json_obj = json.dumps(div_out, indent=True, ensure_ascii=False)
            with open(f"{city}_divisions.json", "w") as out:
                out.write(json_obj)


def reverse_divisions(city):
    with open(f"{city}_divisions_in.json") as div_file:
        divs = json.load(div_file)

        new_features = []

        for div in divs["features"]:
            if "relation" in div["properties"]["@id"]:
                print(div["geometry"]["coordinates"][0])
                new_features.append(
                    {
                        **div,
                        "geometry": {
                            **div["geometry"],
                            "coordinates": [
                                coord[::-1]
                                for coord in div["geometry"]["coordinates"][0]
                            ],
                        },
                    }
                )

        divs["features"] = new_features

        json_obj = json.dumps(divs, indent=True, ensure_ascii=False)
        with open(f"{city}_divisions_reversed.json", "w") as out:
            out.write(json_obj)


def filter_division(city):
    with open(f"{city}_divisions_in.json") as div_file:
        divs = json.load(div_file)

        new_features = list(
            filter(lambda x: "relation" in x["properties"]["@id"], divs["features"])
        )

        divs["features"] = new_features

        json_obj = json.dumps(divs, indent=True, ensure_ascii=False)
        with open(f"{city}_divisions_filtered.json", "w") as out:
            out.write(json_obj)


city = input("wpisz nazwe miasta\n")
choice = input(
    "1. process data\n2. process data and generate divisions\n3. generate divisions\n4. reverse divisions\n5. filter divisions\n"
)

match choice:
    case "1":
        process_data(city)
    case "2":
        process_data(city)
        generate_divisions(city)
    case "3":
        generate_divisions(city)
    case "4":
        reverse_divisions(city)
    case "5":
        filter_division(city)
    case _:
        print("wrong choice")
