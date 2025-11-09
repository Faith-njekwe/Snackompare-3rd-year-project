import React, { useState } from "react";

export default function frontend() {
  const [product1, setProduct1] = useState(null);
  const [product2, setProduct2] = useState(null);
  const [activeSelector, setActiveSelector] = useState(null); // "p1" | "p2" | null
  const [mode, setMode] = useState(null); // "menu" | "searchName" | "barcode"
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  // --- API Calls ---
  async function searchProducts(name) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          name
        )}&search_simple=1&json=1&page_size=5`
      );
      const data = await res.json();
      return data.products || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function getProductByBarcode(barcode) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await res.json();
      return data.status === 1 ? data.product : null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // --- UI Flow ---
  const startSelection = (which) => {
    setActiveSelector(which);
    setMode("menu");
    setQuery("");
    setResults([]);
    setError("");
  };

  const handleSearch = async () => {
    const prods = await searchProducts(query);
    if (!prods.length) setError("No products found. Try again.");
    setResults(prods);
  };

  const handleBarcode = async () => {
    const product = await getProductByBarcode(query);
    if (!product) {
      setError("Invalid barcode. Try again.");
      return;
    }
    saveProduct(product);
  };

  const saveProduct = (product) => {
    const nutrition = extractNutrition(product);
    if (activeSelector === "p1") setProduct1(nutrition);
    if (activeSelector === "p2") setProduct2(nutrition);
    setActiveSelector(null);
    setMode(null);
  };

  const extractNutrition = (product) => {
    const n = product.nutriments || {};
    return {
      name: product.product_name || "Unknown",
      brand: product.brands || "Unknown",
      energy_100g: n["energy-kcal_100g"] || n["energy_100g"],
      fat_100g: n["fat_100g"],
      saturated_fat_100g: n["saturated-fat_100g"],
      carbohydrates_100g: n["carbohydrates_100g"],
      sugars_100g: n["sugars_100g"],
      protein_100g: n["proteins_100g"],
      fiber_100g: n["fiber_100g"],
      salt_100g: n["salt_100g"],
    };
  };

  // --- UI Rendering ---
  //the tailwind isn't working so will probably have to change to boostrap or fix it later
  return (
     <div className="min-h-screen flex flex-col items-center bg-white py-12 px-6">
    {/* Title */}
    <h1 className="text-2xl font-extrabold text-center mb-12 flex items-center gap-3">
      SnackCompare Nutrition Checker
    </h1>

      {/* Buttons for Product 1 & 2 */}
    <div className="flex gap-8 justify-center mb-12">
          <button
            onClick={() => startSelection("p1")}
            className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
          >
            {product1 ? product1.name : "Select Product 1"}
          </button>
          <button
            onClick={() => startSelection("p2")}
            className="px-6 py-3 rounded-xl bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition"
          >
            {product2 ? product2.name : "Select Product 2"}
          </button>
        </div>

        {/* Dropdown Menu */}
        {activeSelector && mode === "menu" && (
          <div className="text-center space-x-3 mb-8">
            <button
              onClick={() => setMode("searchName")}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Search by Name
            </button>
            <button
              onClick={() => setMode("barcode")}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Enter Barcode
            </button>
            <button
              onClick={() => {
                setActiveSelector(null);
                setMode(null);
              }}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Search by Name */}
        {mode === "searchName" && (
          <div className="text-center space-y-2 mb-12">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter product name"
              className="border rounded p-2 w-64"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Search
            </button>
            {error && <p className="text-red-600">{error}</p>}
            <ul className="mt-2">
              {results.map((p, i) => (
                <li key={i}>
                  <button
                    onClick={() => saveProduct(p)}
                    className="text-blue-700 underline"
                  >
                    {p.product_name || "Unnamed"} – {p.brands}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Search by Barcode */}
        {mode === "barcode" && (
          <div className="text-center space-y-2 mb-12">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter barcode"
              className="border rounded p-2 w-64"
            />
            <button
              onClick={handleBarcode}
              className="px-3 py-1 bg-blue-500 text-white rounded"
            >
              Submit
            </button>
            {error && <p className="text-red-600">{error}</p>}
          </div>
        )}

        {/* Comparison Table */}
        {product1 && product2 && (
          <div className="mt-16 w-full max-w-3xl">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Nutrition Comparison (per 100g/ml)
            </h2>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-8 py-3 text-left">Nutrient</th>
                  <th className="border px-8 py-3  text-left">{product1.name}</th>
                  <th className="border px-8 py-3  text-left">{product2.name}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Energy (kcal)", "energy_100g"],
                  ["Fat (g)", "fat_100g"],
                  ["Saturated Fat (g)", "saturated_fat_100g"],
                  ["Carbohydrates (g)", "carbohydrates_100g"],
                  ["Sugars (g)", "sugars_100g"],
                  ["Protein (g)", "protein_100g"],
                  ["Fiber (g)", "fiber_100g"],
                  ["Salt (g)", "salt_100g"],
                ].map(([label, key]) => (
                  <tr key={key}>
                    <td className="px-8 py-3 font-medium text-gray-800">{label}</td>
                    <td className="border px-8 py-3">{product1[key] ?? "N/A"}</td>
                    <td className="border px-8 py-3">{product2[key] ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
