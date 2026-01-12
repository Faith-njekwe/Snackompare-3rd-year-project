import React, { useMemo, useState } from "react";

const mockProducts = [
  {
    id: "granola-001",
    name: "Crunchy Granola",
    brand: "GoodGrain",
    category: "Breakfast",
    nutrition: {
      energy: 420,
      fat: 12,
      saturatedFat: 2,
      carbs: 65,
      sugar: 18,
      protein: 9,
      fiber: 7,
      salt: 0.6,
    },
  },
  {
    id: "yogurt-002",
    name: "Greek Yogurt (Low Fat)",
    brand: "CreamCo",
    category: "Dairy",
    nutrition: {
      energy: 95,
      fat: 2,
      saturatedFat: 1,
      carbs: 6,
      sugar: 5,
      protein: 10,
      fiber: 0,
      salt: 0.2,
    },
  },
  {
    id: "choc-003",
    name: "Milk Chocolate Bar",
    brand: "ChocoBite",
    category: "Snacks",
    nutrition: {
      energy: 540,
      fat: 32,
      saturatedFat: 20,
      carbs: 55,
      sugar: 50,
      protein: 6,
      fiber: 2,
      salt: 0.3,
    },
  },
  {
    id: "chips-004",
    name: "Sea Salt Crisps",
    brand: "Crunchies",
    category: "Snacks",
    nutrition: {
      energy: 510,
      fat: 32,
      saturatedFat: 3,
      carbs: 50,
      sugar: 1,
      protein: 6,
      fiber: 4,
      salt: 1.3,
    },
  },
  {
    id: "apple-005",
    name: "Apple Slices",
    brand: "FreshFields",
    category: "Fruit",
    nutrition: {
      energy: 52,
      fat: 0.2,
      saturatedFat: 0,
      carbs: 14,
      sugar: 10,
      protein: 0.3,
      fiber: 2.4,
      salt: 0,
    },
  },
  {
    id: "bar-006",
    name: "Protein Bar (Salted Caramel)",
    brand: "FuelUp",
    category: "Snacks",
    nutrition: {
      energy: 210,
      fat: 6,
      saturatedFat: 2,
      carbs: 18,
      sugar: 6,
      protein: 20,
      fiber: 8,
      salt: 0.5,
    },
  },
];

function scoreProduct(nutrition) {
  if (!nutrition) return { score: 0, label: "Unknown" };
  // Simple illustrative scoring formula — lower sugar/salt/fat, higher fiber/protein
  const penalties =
    (nutrition.sugar || 0) * 0.7 +
    (nutrition.salt || 0) * 10 +
    (nutrition.saturatedFat || 0) * 0.8;
  const boosts = (nutrition.fiber || 0) * 2 + (nutrition.protein || 0) * 0.6;
  const score = Math.max(10, Math.min(100, Math.round(80 + boosts - penalties)));
  let label = "Balanced";
  if (score >= 85) label = "Great";
  else if (score >= 70) label = "Better";
  else if (score <= 40) label = "Limit";
  return { score, label };
}

function formatNumber(value, suffix = "") {
  if (value === undefined || value === null) return "N/A";
  return `${value}${suffix}`;
}

function dayName(index) {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return names[index] || `Day ${index + 1}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [scanResult, setScanResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(mockProducts);
  const [compareSelection, setCompareSelection] = useState({
    left: mockProducts[0],
    right: mockProducts[1],
  });
  const [favorites, setFavorites] = useState([mockProducts[1], mockProducts[5]]);
  const [profile, setProfile] = useState({
    name: "Taylor",
    goal: "Lean & balanced",
    diet: "No preference",
    allergens: "None",
    calorieTarget: 2200,
  });
  const [mealPlan, setMealPlan] = useState([]);
  const [notes, setNotes] = useState("");

  const comparisonRows = useMemo(() => {
    const { left, right } = compareSelection;
    if (!left || !right) return [];
    const compareKeys = [
      ["Energy (kcal)", "energy"],
      ["Fat (g)", "fat"],
      ["Saturated Fat (g)", "saturatedFat"],
      ["Carbohydrates (g)", "carbs"],
      ["Sugars (g)", "sugar"],
      ["Protein (g)", "protein"],
      ["Fiber (g)", "fiber"],
      ["Salt (g)", "salt"],
    ];
    return compareKeys.map(([label, key]) => ({
      label,
      left: left.nutrition[key],
      right: right.nutrition[key],
    }));
  }, [compareSelection]);

  const alternativeOptions = useMemo(() => {
    if (!scanResult) return [];
    const baseScore = scoreProduct(scanResult.nutrition).score;
    return mockProducts
      .filter((p) => p.id !== scanResult.id)
      .map((p) => ({ ...p, score: scoreProduct(p.nutrition).score }))
      .filter((p) => p.score >= baseScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [scanResult]);

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setSearchResults(mockProducts);
      setNotes("Showing all items. Add a keyword to filter.");
      return;
    }
    const filtered = mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
    setNotes(
      filtered.length
        ? `Found ${filtered.length} items matching "${searchQuery}".`
        : `No matches for "${searchQuery}".`
    );
    setSearchResults(filtered);
  };

  const simulateScan = () => {
    const pick = mockProducts[Math.floor(Math.random() * mockProducts.length)];
    setScanResult(pick);
    setActiveTab("scan");
    setNotes(`Simulated scan picked ${pick.name}.`);
  };

  const selectComparison = (product, slot) => {
    setCompareSelection((prev) => ({ ...prev, [slot]: product }));
  };

  const toggleFavorite = (product) => {
    setFavorites((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  const buildMealPlan = () => {
    const picks = [...mockProducts].sort(() => 0.5 - Math.random());
    const plan = Array.from({ length: 7 }).map((_, i) => ({
      day: dayName(i),
      breakfast: picks[(i + 1) % picks.length],
      lunch: picks[(i + 2) % picks.length],
      dinner: picks[(i + 3) % picks.length],
      snack: picks[(i + 4) % picks.length],
    }));
    setMealPlan(plan);
    setActiveTab("meal");
    setNotes("Weekly plan generated with your saved foods and preferences.");
  };

  const renderProductCard = (product, actions = null) => {
    const { score, label } = scoreProduct(product.nutrition);
    return (
      <div key={product.id} className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">{product.category}</p>
            <p className="card-title">{product.name}</p>
            <p className="muted">{product.brand}</p>
          </div>
          <div className="pill">
            <span className="pill-score">{score}</span>
            <span className="pill-label">{label}</span>
          </div>
        </div>
        <div className="grid nutrition-grid">
          <span>Energy</span>
          <span>{formatNumber(product.nutrition.energy, " kcal")}</span>
          <span>Fat</span>
          <span>{formatNumber(product.nutrition.fat, " g")}</span>
          <span>Saturated</span>
          <span>{formatNumber(product.nutrition.saturatedFat, " g")}</span>
          <span>Carbs</span>
          <span>{formatNumber(product.nutrition.carbs, " g")}</span>
          <span>Sugars</span>
          <span>{formatNumber(product.nutrition.sugar, " g")}</span>
          <span>Protein</span>
          <span>{formatNumber(product.nutrition.protein, " g")}</span>
          <span>Fiber</span>
          <span>{formatNumber(product.nutrition.fiber, " g")}</span>
          <span>Salt</span>
          <span>{formatNumber(product.nutrition.salt, " g")}</span>
        </div>
        {actions && <div className="actions-row">{actions}</div>}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">SnacKompare</p>
          <h1>Healthier choices, fast.</h1>
        </div>
        <button className="primary ghost" onClick={simulateScan}>
          Quick Scan
        </button>
      </header>

      <section className="panel hero">
        <div>
          <p className="eyebrow">Today</p>
          <h2>{profile.goal}</h2>
          <p className="muted">
            Compare foods, get alternatives, and build AI meal plans – fully
            offline demo with mocked data.
          </p>
          <div className="chip-row">
            <span className="chip">Barcode + manual search</span>
            <span className="chip">Health scoring</span>
            <span className="chip">Meal plan generator</span>
          </div>
        </div>
        <div className="stat-block">
          <p className="eyebrow">Favourites</p>
          <h3>{favorites.length}</h3>
          <p className="muted">saved items for tailored plans</p>
          <button className="primary" onClick={buildMealPlan}>
            Build weekly plan
          </button>
        </div>
      </section>

      <nav className="tab-row">
        {[
          ["home", "Home"],
          ["scan", "Scan"],
          ["search", "Search"],
          ["compare", "Compare"],
          ["meal", "Meals"],
          ["profile", "Profile"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {notes && <div className="banner">{notes}</div>}

      {activeTab === "home" && (
        <section className="stack">
          {renderProductCard(favorites[0] || mockProducts[0], (
            <>
              <button className="ghost" onClick={() => setActiveTab("compare")}>
                Use in comparison
              </button>
              <button className="primary" onClick={buildMealPlan}>
                Refresh meal plan
              </button>
            </>
          ))}
          <div className="panel">
            <h3>Quick actions</h3>
            <div className="actions-row">
              <button className="primary" onClick={simulateScan}>
                Simulate barcode scan
              </button>
              <button className="secondary" onClick={() => setActiveTab("search")}>
                Search catalog
              </button>
              <button className="ghost" onClick={() => setActiveTab("profile")}>
                Update preferences
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "scan" && (
        <section className="stack">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Barcode scanner</p>
                <h3>Tap scan to capture a code</h3>
                <p className="muted">
                  Camera permissions are required in the mobile app. Here we simulate the
                  scan flow and show cleaned nutrition.
                </p>
              </div>
              <button className="primary" onClick={simulateScan}>
                Scan now
              </button>
            </div>
            {scanResult ? (
              <>
                {renderProductCard(scanResult, (
                  <>
                    <button
                      className="secondary"
                      onClick={() => toggleFavorite(scanResult)}
                    >
                      {favorites.find((f) => f.id === scanResult.id)
                        ? "Remove favourite"
                        : "Save favourite"}
                    </button>
                    <button
                      className="ghost"
                      onClick={() => {
                        selectComparison(scanResult, "left");
                        setActiveTab("compare");
                      }}
                    >
                      Compare
                    </button>
                  </>
                ))}
                <div className="panel alt-list">
                  <div className="panel-head">
                    <div>
                      <p className="eyebrow">Healthier picks</p>
                      <h3>Alternatives</h3>
                    </div>
                    <p className="muted">
                      Ranked by health score and similar category.
                    </p>
                  </div>
                  <div className="grid alt-grid">
                    {alternativeOptions.map((p) => (
                      <div key={p.id} className="alt-card">
                        <p className="card-title">{p.name}</p>
                        <p className="muted">{p.brand}</p>
                        <div className="pill small">
                          <span className="pill-score">{p.score}</span>
                          <span className="pill-label">Score</span>
                        </div>
                        <button
                          className="ghost"
                          onClick={() => {
                            selectComparison(p, "right");
                            setActiveTab("compare");
                          }}
                        >
                          Compare
                        </button>
                      </div>
                    ))}
                    {!alternativeOptions.length && (
                      <p className="muted">No stronger alternatives found.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="placeholder">
                <p className="muted">No scan yet. Tap scan to start.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "search" && (
        <section className="stack">
          <div className="panel">
            <div className="search-bar">
              <input
                value={searchQuery}
                placeholder="Search by name, brand, or category"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="primary" onClick={handleSearch}>
                Search
              </button>
            </div>
            <div className="grid card-grid">
              {searchResults.map((p) =>
                renderProductCard(p, (
                  <>
                    <button className="secondary" onClick={() => toggleFavorite(p)}>
                      {favorites.find((f) => f.id === p.id)
                        ? "Unsave"
                        : "Save favourite"}
                    </button>
                    <button
                      className="ghost"
                      onClick={() => {
                        selectComparison(p, "right");
                        setActiveTab("compare");
                      }}
                    >
                      Compare
                    </button>
                  </>
                ))
              )}
              {!searchResults.length && (
                <div className="placeholder">No products found.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "compare" && (
        <section className="stack">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Compare</p>
                <h3>Two-way nutrition view</h3>
                <p className="muted">
                  Replace either side with search results, scan output, or favourites.
                </p>
              </div>
            </div>
            <div className="compare-selectors">
              {["left", "right"].map((slot) => (
                <div key={slot} className="selector">
                  <p className="eyebrow">Product {slot === "left" ? 1 : 2}</p>
                  <select
                    value={compareSelection[slot]?.id || ""}
                    onChange={(e) => {
                      const product = mockProducts.find((p) => p.id === e.target.value);
                      if (product) selectComparison(product, slot);
                    }}
                  >
                    {mockProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="comparison-table">
              <div className="comp-head">
                <span>Nutrient</span>
                <span>{compareSelection.left?.name || "Product 1"}</span>
                <span>{compareSelection.right?.name || "Product 2"}</span>
              </div>
              {comparisonRows.map((row) => (
                <div key={row.label} className="comp-row">
                  <span>{row.label}</span>
                  <span>{formatNumber(row.left, " g")}</span>
                  <span>{formatNumber(row.right, " g")}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === "meal" && (
        <section className="stack">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Weekly plan</p>
                <h3>AI-structured meals</h3>
              </div>
              <button className="primary" onClick={buildMealPlan}>
                Regenerate
              </button>
            </div>
            {mealPlan.length ? (
              <div className="grid meal-grid">
                {mealPlan.map((day) => (
                  <div key={day.day} className="meal-card">
                    <p className="eyebrow">{day.day}</p>
                    <p className="muted">Breakfast</p>
                    <p className="card-title">{day.breakfast.name}</p>
                    <p className="muted">Lunch</p>
                    <p className="card-title">{day.lunch.name}</p>
                    <p className="muted">Dinner</p>
                    <p className="card-title">{day.dinner.name}</p>
                    <p className="muted">Snack</p>
                    <p className="card-title">{day.snack.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder">
                <p className="muted">
                  No plan yet. Tap regenerate to produce a 7-day schedule.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "profile" && (
        <section className="stack">
          <div className="panel">
            <h3>User profile</h3>
            <div className="form-grid">
              <label>
                <span>Name</span>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </label>
              <label>
                <span>Goal</span>
                <input
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                />
              </label>
              <label>
                <span>Dietary preference</span>
                <input
                  value={profile.diet}
                  onChange={(e) => setProfile({ ...profile, diet: e.target.value })}
                />
              </label>
              <label>
                <span>Allergens</span>
                <input
                  value={profile.allergens}
                  onChange={(e) =>
                    setProfile({ ...profile, allergens: e.target.value })
                  }
                />
              </label>
              <label>
                <span>Daily calories target</span>
                <input
                  type="number"
                  value={profile.calorieTarget}
                  onChange={(e) =>
                    setProfile({ ...profile, calorieTarget: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className="panel-foot">
              <p className="muted">
                Preferences feed into scoring, alternative suggestions, and weekly plans.
              </p>
              <button className="primary" onClick={buildMealPlan}>
                Save & regenerate plan
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
