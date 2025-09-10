/* eslint-disable @typescript-eslint/no-unused-vars */
// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "../../styles/Kirana.module.css";

interface Item {
  name: string;
  quantity: string;
  unit: string;
  category: string;
}

interface Category {
  name: string;
  items: Item[];
}

interface SavedList {
  id: string;
  name: string;
  date: string;
  categories: Category[];
}

export default function KiranaList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newUnit, setNewUnit] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [showSavedLists, setShowSavedLists] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Initialize data from localStorage or default data
  useEffect(() => {
    const storedData = localStorage.getItem("kiranaList");
    const storedLists = localStorage.getItem("savedKiranaLists");

    if (storedData) {
      setCategories(JSON.parse(storedData));
    } else {
      // Default data
      setCategories([
        {
          name: "किराणा",
          items: [
            { name: "शेंगदाणे", quantity: "", unit: "kg", category: "किराणा" },
            { name: "साबुदाणा", quantity: "", unit: "kg", category: "किराणा" },
            { name: "तूर डाळ", quantity: "", unit: "kg", category: "किराणा" },
            { name: "मूग डाळ", quantity: "", unit: "kg", category: "किराणा" },
            { name: "मटकी", quantity: "", unit: "kg", category: "किराणा" },
            { name: "मूग", quantity: "", unit: "kg", category: "किराणा" },
            { name: "खोबरे", quantity: "", unit: "kg", category: "किराणा" },
            { name: "पोहे", quantity: "", unit: "kg", category: "किराणा" },
            { name: "रवा", quantity: "", unit: "kg", category: "किराणा" },
            { name: "हुलगा", quantity: "", unit: "kg", category: "किराणा" },
            { name: "भगर", quantity: "", unit: "kg", category: "किराणा" },
            { name: "मटकी डाळ", quantity: "", unit: "kg", category: "किराणा" },
            { name: "मसूर डाळ", quantity: "", unit: "kg", category: "किराणा" },
          ],
        },
        {
          name: "डी मार्ट",
          items: [
            {
              name: "रिन पाऊडर",
              quantity: "",
              unit: "kg",
              category: "डी मार्ट",
            },
            {
              name: "रिन साबण",
              quantity: "",
              unit: "pcs",
              category: "डी मार्ट",
            },
            {
              name: "गोदरेज नंबर १",
              quantity: "",
              unit: "pcs",
              category: "डी मार्ट",
            },
            { name: "चहा", quantity: "", unit: "pkg", category: "डी मार्ट" },
            {
              name: "बिस्किट्स",
              quantity: "",
              unit: "pkg",
              category: "डी मार्ट",
            },
            { name: "खजूर", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "बदाम", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "मनुके", quantity: "", unit: "pkg", category: "डी मार्ट" },
            {
              name: "टूथपेस्ट",
              quantity: "",
              unit: "pcs",
              category: "डी मार्ट",
            },
            { name: "गूळ", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "जीरा", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "मोहरी", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "बडीशेप", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "धना डाळ", quantity: "", unit: "kg", category: "डी मार्ट" },
            {
              name: "लापशी रवा",
              quantity: "",
              unit: "kg",
              category: "डी मार्ट",
            },
            { name: "मेथी बी", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "तीळ", quantity: "", unit: "kg", category: "डी मार्ट" },
            {
              name: "हिरवी विलायची",
              quantity: "",
              unit: "kg",
              category: "डी मार्ट",
            },
            { name: "मीठ", quantity: "", unit: "kg", category: "डी मार्ट" },
            { name: "जवस", quantity: "", unit: "kg", category: "डी मार्ट" },
            {
              name: "देवाचे तेल",
              quantity: "",
              unit: "l",
              category: "डी मार्ट",
            },
            {
              name: "उदबत्ती",
              quantity: "",
              unit: "pcs",
              category: "डी मार्ट",
            },
            { name: "धूप", quantity: "", unit: "pcs", category: "डी मार्ट" },
            { name: "कापुर", quantity: "", unit: "pcs", category: "डी मार्ट" },
            { name: "बड्स", quantity: "", unit: "pcs", category: "डी मार्ट" },
            {
              name: "सांबर मसाला",
              quantity: "",
              unit: "pkg",
              category: "डी मार्ट",
            },
            {
              name: "गरम मसाला",
              quantity: "",
              unit: "pkg",
              category: "डी मार्ट",
            },
            {
              name: "बिर्याणी मसाला",
              quantity: "",
              unit: "pkg",
              category: "डी मार्ट",
            },
            { name: "हळद", quantity: "", unit: "kg", category: "डी मार्ट" },
            {
              name: "धना पाऊडर",
              quantity: "",
              unit: "kg",
              category: "डी मार्ट",
            },
            { name: "शांपु", quantity: "", unit: "pcs", category: "डी मार्ट" },
            {
              name: "पॅरॅशूट तेल",
              quantity: "",
              unit: "l",
              category: "डी मार्ट",
            },
            {
              name: "बोडिस्प्रे",
              quantity: "",
              unit: "pcs",
              category: "डी मार्ट",
            },
            {
              name: "टूथब्रश",
              quantity: "",
              unit: "pcs",
              category: "डी मार्ट",
            },
            { name: "कॉफी", quantity: "", unit: "pkg", category: "डी मार्ट" },
            { name: "मध", quantity: "", unit: "kg", category: "डी मार्ट" },
            {
              name: "मिक्स डाळ",
              quantity: "",
              unit: "kg",
              category: "डी मार्ट",
            },
            { name: "चवळी", quantity: "", unit: "kg", category: "डी मार्ट" },
            {
              name: "पितांबरी",
              quantity: "",
              unit: "pcs",
              category: "डी मार्ट",
            },
            { name: "माचिस", quantity: "", unit: "pcs", category: "डी मार्ट" },
          ],
        },
      ]);
    }

    if (storedLists) {
      setSavedLists(JSON.parse(storedLists));
    }
  }, []);

  // Save to localStorage whenever categories change
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem("kiranaList", JSON.stringify(categories));
    }
  }, [categories]);

  // Save saved lists to localStorage whenever they change
  useEffect(() => {
    if (savedLists.length > 0) {
      localStorage.setItem("savedKiranaLists", JSON.stringify(savedLists));
    }
  }, [savedLists]);

  const handleQuantityChange = (
    categoryIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].items[itemIndex].quantity = value;
    setCategories(updatedCategories);
  };

  const handleUnitChange = (
    categoryIndex: number,
    itemIndex: number,
    value: string
  ) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].items[itemIndex].unit = value;
    setCategories(updatedCategories);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const shareOnWhatsApp = () => {
    let message = "किराणा सूची:\n\n";

    categories.forEach((category) => {
      message += `*${category.name}:*\n`;

      category.items.forEach((item) => {
        if (item.quantity) {
          message += `• ${item.name}: ${item.quantity} ${item.unit}\n`;
        }
      });

      message += "\n";
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const clearAllQuantities = () => {
    const updatedCategories = categories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({ ...item, quantity: "" })),
    }));
    setCategories(updatedCategories);
  };

  const saveCurrentList = () => {
    if (!newListName.trim()) {
      alert("Please enter a name for your list");
      return;
    }

    const newSavedList: SavedList = {
      id: Date.now().toString(),
      name: newListName,
      date: new Date().toLocaleDateString("en-IN"),
      categories: JSON.parse(JSON.stringify(categories)), // Deep copy
    };

    const updatedSavedLists = [...savedLists, newSavedList];
    setSavedLists(updatedSavedLists);
    setNewListName("");
    alert("List saved successfully!");
  };

  const loadSavedList = (list: SavedList) => {
    setCategories(JSON.parse(JSON.stringify(list.categories))); // Deep copy
    setShowSavedLists(false);
    alert(`Loaded list: ${list.name}`);
  };

  const deleteSavedList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved list?")) {
      const updatedSavedLists = savedLists.filter((list) => list.id !== id);
      setSavedLists(updatedSavedLists);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>किराणा सूची</h1>
        <p className={styles.subtitle}>Manage your shopping list</p>
      </div>

      <div className={styles.controls}>
        <button className={styles.buttonEdit} onClick={toggleEdit}>
          {isEditing ? "सेव करा" : "एडिट करा"}
        </button>
        <button className={styles.buttonWhatsapp} onClick={shareOnWhatsApp}>
          WhatsApp
        </button>
        <button className={styles.buttonClear} onClick={clearAllQuantities}>
          क्लियर
        </button>
        <button
          className={styles.buttonSaved}
          onClick={() => setShowSavedLists(!showSavedLists)}
        >
          {showSavedLists ? "होम" : "सेव्ड लिस्ट"}
        </button>
      </div>

      {showSavedLists ? (
        <div className={styles.savedListsContainer}>
          <h2 className={styles.savedListsTitle}>Saved Lists</h2>
          {savedLists.length === 0 ? (
            <p className={styles.noLists}>No saved lists found</p>
          ) : (
            <div className={styles.savedLists}>
              {savedLists.map((list) => (
                <div
                  key={list.id}
                  className={styles.savedListCard}
                  onClick={() => loadSavedList(list)}
                >
                  <div className={styles.savedListInfo}>
                    <h3>{list.name}</h3>
                    <p>Saved on: {list.date}</p>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => deleteSavedList(list.id, e)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={styles.saveListForm}>
            <input
              type="text"
              placeholder="Enter list name"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className={styles.listNameInput}
            />
            <button onClick={saveCurrentList} className={styles.saveListButton}>
              Save Current List
            </button>
          </div>

          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className={styles.category}>
              <h2 className={styles.categoryTitle}>{category.name}</h2>
              <div className={styles.itemsGrid}>
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className={styles.itemCard}>
                    <span className={styles.itemName}>{item.name}</span>
                    <div className={styles.inputGroup}>
                      <input
                        type="text"
                        className={styles.quantityInput}
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            categoryIndex,
                            itemIndex,
                            e.target.value
                          )
                        }
                        placeholder="0"
                        disabled={!isEditing}
                      />
                      <select
                        value={item.unit}
                        className={styles.unitSelect}
                        onChange={(e) =>
                          handleUnitChange(
                            categoryIndex,
                            itemIndex,
                            e.target.value
                          )
                        }
                        disabled={!isEditing}
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                        <option value="pkg">pkg</option>
                        <option value="box">box</option>
                        <option value="bottle">bottle</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <div className={styles.footer}>
        <p>तुमची किराणा सूची स्थानिक स्टोरेजमध्ये सेव केली जाते.</p>
      </div>
    </div>
  );
}
