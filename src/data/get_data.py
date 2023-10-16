import csv
import json

was = []
out = {}

with open("streets_with_coords.csv") as csvfile:
    reader = csv.reader(csvfile, delimiter="\t")

    for row in reader:
        print(row[0])
        if row[0] not in was:
            was.append(row[0])

            # out.append({"name": row[0], "lat": row[1], "lon": row[2]})
            out[row[0]] = {"lat": row[1], "lon": row[2]}

json_obj = json.dumps(out, indent=True, ensure_ascii=False)
with open("out.json", "w") as out:
    out.write(json_obj)
