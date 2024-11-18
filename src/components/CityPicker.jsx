import { useEffect, useState } from "react";
import { FaChevronRight } from "react-icons/fa";

const CityPicker = () => {
    const [citySearchValue, setCitySearchValue] = useState("");
    const [cityDistricts, setCityDistricts] = useState([]);
    const [didSearch, setDidSearch] = useState(false);
    const [cityName, setCityName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCitySearch = async () => {
        setIsLoading(true);
        console.log("Searching for city: ", citySearchValue);
        const districts = await getCityDistricts(citySearchValue);
        setCityDistricts(districts);
        setDidSearch(true);

        setCityName(citySearchValue);
        setCitySearchValue("");
        setIsLoading(false);
    };

    const handleCitySearchValueChange = (event) => {
        setCitySearchValue(
            event.target.value.charAt(0).toUpperCase() +
                event.target.value.slice(1),
        );
    };

    const handleDistrictSelectedChange = (district) => {
        setCityDistricts(
            cityDistricts.map((d) =>
                d.id === district.id ? { ...d, selected: !d.selected } : d,
            ),
        );
    };

    const handleCheckAll = (event) => {
        if (event.target.checked) {
            setCityDistricts(
                cityDistricts.map((d) => ({ ...d, selected: true })),
            );
        } else {
            setCityDistricts(
                cityDistricts.map((d) => ({ ...d, selected: false })),
            );
        }
    };

    useEffect(() => {
        console.log(cityDistricts);
    }, [cityDistricts]);

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

            return data.elements
                .filter((element) => element.tags && element.tags.name)
                .sort((a, b) => a.tags.name.localeCompare(b.tags.name))
                .map((element) => ({
                    name: element.tags.name,
                    id: element.id,
                    selected: false,
                }));
        } catch (error) {
            console.error(error);
            return [];
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
                <div className="modal-box flex flex-col gap-2">
                    <h3 className="text-lg font-bold">Wyszukaj</h3>
                    <label className="flex items-center gap-2">
                        <input
                            type="text"
                            className={"input input-bordered grow"}
                            value={citySearchValue}
                            placeholder="Wpisz nazwe miasta"
                            disabled={isLoading}
                            onChange={handleCitySearchValueChange}
                        />
                        {isLoading ? (
                            <span className="loading loading-spinner loading-md"></span>
                        ) : (
                            <button
                                className="btn btn-square"
                                onClick={handleCitySearch}
                            >
                                <FaChevronRight />
                            </button>
                        )}
                    </label>
                    {didSearch && cityDistricts.length !== 0 && (
                        <div>
                            <p>
                                <span className="font-bold">{cityName}</span>:
                                znaleziono {cityDistricts.length} dzielnic.
                                <br /> Zaznacz te, na których chcesz grać.
                            </p>
                            <div className="my-2 flex gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    onChange={handleCheckAll}
                                />
                                <p className="font-bold">Zaznacz wszystkie</p>
                            </div>
                        </div>
                    )}
                    <ul className="flex flex-col gap-2">
                        {cityDistricts.map((district) => (
                            <li key={district.id} className="flex gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={district.selected}
                                    onChange={() =>
                                        handleDistrictSelectedChange(district)
                                    }
                                />
                                {district.name}
                            </li>
                        ))}
                    </ul>
                    {cityDistricts.length === 0 && didSearch && (
                        <p>
                            Podane miasto nie ma dzielnic w OSM. Czy chcesz
                            zagrać na całym obszarze miasta?
                        </p>
                    )}
                    <div className="modal-action">
                        <form method="dialog" className="">
                            <button className="btn">Wybierz</button>
                        </form>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>zamknij</button>
                </form>
            </dialog>
        </div>
    );
};

export default CityPicker;
