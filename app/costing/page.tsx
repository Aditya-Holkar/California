"use client";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "../../app/page.module.css"; // Import styles as a module
import BackButton from "../Components/Backbutton/Backbutton";

interface Product {
  name: string;
  unitType: string;
  unitPrice: string;
  quantityPerCup: string;
  totalPieces?: string;
}

export default function Calc() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState<Product>({
    name: "",
    unitType: "",
    unitPrice: "",
    quantityPerCup: "",
    totalPieces: "",
  });
  const [sellingPrice, setSellingPrice] = useState("");
  const [additionalCost, setAdditionalCost] = useState("");
  const [productNameForPDF, setProductNameForPDF] = useState<string | null>(
    null
  );
  const [showModal, setShowModal] = useState(false); // Modal state

  const handleAddProduct = () => {
    setProducts([...products, { ...newProduct }]);
    setNewProduct({
      name: "",
      unitType: "",
      unitPrice: "",
      quantityPerCup: "",
      totalPieces: "",
    });
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const calculateCostPerCup = () => {
    return products.reduce((total, product) => {
      let costPerUnit;
      if (product.unitType === "box") {
        const totalPieces = parseFloat(product.totalPieces || "1");
        costPerUnit = parseFloat(product.unitPrice) / totalPieces;
      } else {
        const unitConversion =
          product.unitType === "kg" || product.unitType === "liter" ? 1000 : 1;
        costPerUnit = parseFloat(product.unitPrice) / unitConversion;
      }
      const costForProduct = parseFloat(product.quantityPerCup) * costPerUnit;
      return total + costForProduct;
    }, parseFloat(additionalCost));
  };

  const calculateProfitPerCup = () => {
    const costPerCup = calculateCostPerCup();
    return parseFloat(sellingPrice) - costPerCup;
  };

  const calculateProfitPercentage = () => {
    const profit = calculateProfitPerCup();
    return (profit / parseFloat(sellingPrice)) * 100;
  };

  const calculateCostPercentage = () => {
    const costPerCup = calculateCostPerCup();
    return (costPerCup / parseFloat(sellingPrice)) * 100;
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Table for Results (Left side)
    const costPerCup = calculateCostPerCup().toFixed(2);
    const profitPerCup = calculateProfitPerCup().toFixed(2);
    const profitPercentage = calculateProfitPercentage().toFixed(2);
    const costPercentage = calculateCostPercentage().toFixed(2);

    doc.text("Material Cost and Profit Report", 14, 10);

    // First Table: Material and Profit Report
    autoTable(doc, {
      startY: 20,
      head: [["Metric", "Value"]],
      body: [
        ["Cost per Cup", `${costPerCup}`],
        ["Cost Percentage", `${costPercentage}%`],
        ["Profit per Cup", `${profitPerCup}`],
        ["Profit Percentage", `${profitPercentage}%`],
      ],
    });

    // Manually set Y-position for the second table (adjust as needed)
    const secondTableStartY = 100; // Adjust this value to set the distance between the tables

    // Second Table: Products Details
    const productData = products.map((product) => [
      product.name || "",
      product.unitType || "",
      `${product.unitPrice}` || "",
      product.unitType === "box" ? product.totalPieces || "" : "-",
      product.quantityPerCup || "",
    ]);

    autoTable(doc, {
      startY: secondTableStartY, // Set the starting Y position for the second table
      head: [
        [
          "Name",
          "Unit Type (SI Units)",
          "Unit Price (Per one SI Unit)",
          "Total Pieces",
          "Quantity per Cup (CGS Units)",
        ],
      ],
      body: productData,
    });

    // If productNameForPDF is set, center it on the PDF
    if (productNameForPDF) {
      const pageWidth = doc.internal.pageSize.width;
      const nameWidth =
        doc.getStringUnitWidth(productNameForPDF) * doc.getFontSize();
      const xPosition = (pageWidth - nameWidth) / 2;
      doc.text(productNameForPDF, xPosition, 160); // Adjust Y-position as needed
    }

    // Save the PDF
    doc.save("material_and_profit_report.pdf");
  };

  return (
    <div className={styles.container}>
      <header className="p-4 border-b">
        <BackButton />
      </header>
      <div className={styles.leftPanel}>
        <h1>Material Cost and Profit Calculator</h1>
        <div>
          <h2>Add a Material</h2>
          <label>
            Material Name:
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />
          </label>
          <br />
          <label>
            Unit Type:
            <select
              value={newProduct.unitType}
              onChange={(e) =>
                setNewProduct({ ...newProduct, unitType: e.target.value })
              }
            >
              <option value="">Select Unit</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="liter">Liter (L)</option>
              <option value="box">Box (pieces)</option>
            </select>
          </label>
          <br />
          <label>
            Price per {newProduct.unitType || "unit"} (₹):
            <input
              type="number"
              value={newProduct.unitPrice}
              onChange={(e) =>
                setNewProduct({ ...newProduct, unitPrice: e.target.value })
              }
            />
          </label>
          <br />
          {newProduct.unitType === "box" && (
            <>
              <label>
                Total Pieces in Box:
                <input
                  type="number"
                  value={newProduct.totalPieces}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      totalPieces: e.target.value,
                    })
                  }
                />
              </label>
              <br />
            </>
          )}
          <label>
            Quantity Per Cup (g/ml/piece):
            <input
              type="number"
              value={newProduct.quantityPerCup}
              onChange={(e) =>
                setNewProduct({ ...newProduct, quantityPerCup: e.target.value })
              }
            />
          </label>
          <br />
          <button type="button" onClick={handleAddProduct}>
            Add Material
          </button>
        </div>
        <br />
        <div>
          <label>
            Selling Price Per Cup (₹):
            <input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
          </label>
          <br />
          <label>
            Additional Costs (Labour, Glass, Straw, Electricity) (₹):
            <input
              type="number"
              value={additionalCost}
              onChange={(e) => setAdditionalCost(e.target.value)}
            />
          </label>
          <br />
        </div>
        {products.length > 0 && sellingPrice && additionalCost && (
          <>
            <h2>Results</h2>
            <p className={styles.resultText}>
              Cost Per Cup: ₹{calculateCostPerCup().toFixed(2)}
            </p>
            <p className={styles.resultText}>
              Cost Percentage: {calculateCostPercentage().toFixed(2)}%
            </p>
            <p className={styles.resultText}>
              Profit Per Cup: ₹{calculateProfitPerCup().toFixed(2)}
            </p>
            <p className={styles.resultText}>
              Profit Percentage: {calculateProfitPercentage().toFixed(2)}%
            </p>
            <button onClick={() => setShowModal(true)}>Generate PDF</button>
          </>
        )}
      </div>

      {/* Modal for Product Name */}
      {showModal && (
        <div className={`${styles.modal} ${showModal ? styles.open : ""}`}>
          <div className={styles.modalContent}>
            <h3>Enter Product Name for PDF</h3>
            <input
              type="text"
              value={productNameForPDF || ""}
              onChange={(e) => setProductNameForPDF(e.target.value)}
              placeholder="Enter product name"
            />
            <button
              onClick={() => {
                if (productNameForPDF) {
                  setShowModal(false);
                  generatePDF(); // Generate PDF after closing the modal
                } else {
                  alert("Please enter a product name."); // Show alert if product name is not entered
                }
              }}
              disabled={!productNameForPDF} // Disable button if no product name is entered
            >
              Generate PDF
            </button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className={styles.rightPanel}>
        <h2>Added Materials</h2>
        <ul className={styles.productList}>
          {products.map((product, index) => (
            <li key={index} className={styles.productListItem}>
              <div className={styles.productListItemText}>
                <strong>Name:</strong> {product.name} <br />
                <strong>Unit Type:</strong> {product.unitType} <br />
                <strong>Price per {product.unitType}:</strong> ₹
                {product.unitPrice} <br />
                {product.unitType === "box" && (
                  <>
                    <strong>Total Pieces:</strong> {product.totalPieces} <br />
                  </>
                )}
                <strong>Quantity per Cup:</strong> {product.quantityPerCup}{" "}
                <br />
              </div>
              <button onClick={() => handleRemoveProduct(index)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
