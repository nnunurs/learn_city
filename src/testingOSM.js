const getAreaCode = async (name) => {
    const query = `
        [out:json];
        area[name="${name}"];
        out body;
        `;
    try {
        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: query,
            },
        );
        const data = await response.json();

        const targetCityAreaId = data.elements[0].id;
        return targetCityAreaId;
    } catch (error) {
        console.error(error);
    }
};

const getCityDistricts = async () => {
    // const query = `
    //     [out:json];
    //     area(${areaCode});
    //     rel(area)["boundary"="administrative"];
    //     out geom;
    //     `;
    const query = `
        [out:json];
                    area[name="Kraków"]->.searchArea;
                    (
                      relation["admin_level"="9"](area.searchArea);
                    );
                    out body;
                    >;
                    out skel qt;
                `;

    try {
        const response = await fetch(
            `https://overpass-api.de/api/interpreter`,
            { method: "POST", body: query },
        );
        const data = await response.json();

        data.elements.forEach((element) => {
            try {
                console.log(element.tags.name);
                console.log(element.id)
            } catch {
                // skip
            }
        });
    } catch (error) {
        console.error(error);
    }
};

const getStreetsInDistrict = async (districtId) => {
    const query = `
        [out:json];
        rel(${districtId});
        map_to_area->.searchArea;
        (
          way["highway"](area.searchArea)
            ["highway"!~"footway|cycleway|service|path|construction"]
            ["name"]
            ["area"!~"yes"]
          	["place"!~"square"];
        );
        out geom;
        >;
        out skel qt;
        `;

    try {
        const response = await fetch(
            `https://overpass-api.de/api/interpreter`,
            { method: "POST", body: query },
        );
        const data = await response.json();

        const streets = data.elements.filter((element) => element.type === "way")

        //save streets to json
        const fs = require("fs")
        fs.writeFileSync("streets.json", JSON.stringify(streets, null, 2))


        let streetsCombined = {}
        streets.forEach((element) => {
            let streetTemp = { name: element.tags.name, path: element.geometry }
            if (Object.keys(streetsCombined).includes(element.tags.name)) {
                streetsCombined[element.tags.name].push(streetTemp)
            } else {
                streetsCombined[element.tags.name] = [streetTemp]
            }
        })
        
        //save streetsCombined to json
        fs.writeFileSync("streetsCombined.json", JSON.stringify(streetsCombined, null, 2))
    } catch (error) {
        console.error(error);
    }
}

await getStreetsInDistrict(2642241)
