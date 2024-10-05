import { useState } from "react";

const CityPicker = () => {
    const [citySearchValue, setCitySearchValue] = useState("");
    const [cityDistricts, setCityDistricts] = useState([]);

    const handleCitySearch = async () => {
        setCityDistricts([]);
        console.log("Searching for city: ", citySearchValue);
        await getCityDistricts(citySearchValue);
        if (cityDistricts.length === 0) {
            alert("Podane miasto nie ma dzielnic w OSM. Czy chcesz zagrać na całym obszarze miasta?");
        }
    };

    const getCityDistricts = async (cityName) => {
        const query = `
            [out:json];
            area[name="${cityName}"]->.searchArea;
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
                if (element.tags.name) {
                    setCityDistricts((oldDistricts) => [
                        ...oldDistricts,
                        { name: element.tags.name, id: element.id },
                    ]);
                }
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <button
                className="btn"
                onClick={() =>
                    document.getElementById("city_picker").showModal()
                }
            >
                Wybierz miasto
            </button>
            <dialog id="city_picker" className="modal">
                <div className="modal-box flex flex-col">
                    <h3 className="text-lg font-bold">Wpisz nazwe miasta</h3>
                    <input
                        type="text"
                        className="input"
                        value={citySearchValue}
                        onChange={(e) => setCitySearchValue(e.target.value)}
                    />
                    <button className="btn" onClick={handleCitySearch}>
                        Wyszukaj
                    </button>
                    <ul>
                        {cityDistricts.map((district) => (
                            <li key={district.id}>{district.name}</li>
                        ))}
                    </ul>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn">Wybierz</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default CityPicker;
