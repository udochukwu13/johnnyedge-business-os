"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost_price: number;
  stock_quantity: number;
};

type SaleLine = {
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount: number;
};

type NewSaleFormProps = {
  customers: Customer[];
  products: Product[];
  currency: string;
  onCancel?: () => void;
};

export default function NewSaleForm({
  customers,
  products,
  currency,
  onCancel,
}: NewSaleFormProps) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [saleDiscount, setSaleDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = products.find(
    (product) => product.id === productId
  );

  function addLine() {
    setError("");

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    const existing = lines.find(
      (line) => line.product_id === selectedProduct.id
    );

    if (existing) {
      const newQuantity = existing.quantity + parsedQuantity;

      if (newQuantity > selectedProduct.stock_quantity) {
        setError(
          `Only ${selectedProduct.stock_quantity} units of ${selectedProduct.name} are available.`
        );
        return;
      }

      setLines(
        lines.map((line) =>
          line.product_id === selectedProduct.id
            ? { ...line, quantity: newQuantity }
            : line
        )
      );
    } else {
      if (parsedQuantity > selectedProduct.stock_quantity) {
        setError(
          `Only ${selectedProduct.stock_quantity} units of ${selectedProduct.name} are available.`
        );
        return;
      }

      setLines([
        ...lines,
        {
  product_id: selectedProduct.id,
  quantity: parsedQuantity,
  unit_price: Number(selectedProduct.price),
  unit_cost: Number(selectedProduct.cost_price),
  discount: 0,
}
      ]);
    }

    setProductId("");
    setQuantity("1");
  }

  function updateLineQuantity(productIdToUpdate: string, value: string) {
    const nextQuantity = Number(value);

    setLines(
      lines.map((line) =>
        line.product_id === productIdToUpdate
          ? {
              ...line,
              quantity: Number.isFinite(nextQuantity)
                ? Math.max(0, nextQuantity)
                : 0,
            }
          : line
      )
    );
  }

  function updateLineDiscount(productIdToUpdate: string, value: string) {
    const nextDiscount = Number(value);

    setLines(
      lines.map((line) =>
        line.product_id === productIdToUpdate
          ? {
              ...line,
              discount: Number.isFinite(nextDiscount)
                ? Math.max(0, nextDiscount)
                : 0,
            }
          : line
      )
    );
  }

  function removeLine(productIdToRemove: string) {
    setLines(
      lines.filter((line) => line.product_id !== productIdToRemove)
    );
  }

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          Math.max(
            0,
            line.quantity * line.unit_price - line.discount
          ),
        0
      ),
    [lines]
  );
const totalCOGS = useMemo(
  () =>
    lines.reduce(
      (sum, line) =>
        sum + line.quantity * line.unit_cost,
      0
    ),
  [lines]
);


  const discountAmount = Number(saleDiscount) || 0;
  const taxAmount = Number(tax) || 0;
  const paidAmount = Number(amountPaid) || 0;

  const total = Math.max(
    0,
    subtotal - discountAmount + taxAmount
  );
const grossProfit = total - totalCOGS;
  const balanceDue = Math.max(0, total - paidAmount);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (lines.length === 0) {
      setError("Add at least one product to the sale.");
      return;
    }

    if (paidAmount > total) {
      setError("Amount paid cannot exceed the sale total.");
      return;
    }

    for (const line of lines) {
      const product = products.find(
        (item) => item.id === line.product_id
      );

      if (!product) {
        setError("One of the selected products could not be found.");
        return;
      }

      if (line.quantity <= 0) {
        setError(`Quantity for ${product.name} must be greater than zero.`);
        return;
      }

      if (line.quantity > product.stock_quantity) {
        setError(
          `Only ${product.stock_quantity} units of ${product.name} are available.`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customerId || null,
          discount: discountAmount,
          tax: taxAmount,
          amount_paid: paidAmount,
          notes: notes.trim() || null,
          items: lines.map((line) => ({
            product_id: line.product_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            discount: line.discount,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to create sale.");
        setLoading(false);
        return;
      }

      router.refresh();

      if (onCancel) {
        onCancel();
      }
    } catch {
      setError("Unable to connect to the sales service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Create new sale
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add products, payment details, and customer information.
        </p>
      </div>

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="sale-customer"
            className="text-sm font-medium text-slate-700"
          >
            Customer
          </label>

          <select
            id="sale-customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-950"
          >
            <option value="">Walk-in customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="grid gap-4 md:grid-cols-[1fr_140px_auto]">
            <div>
              <label
                htmlFor="sale-product"
                className="text-sm font-medium text-slate-700"
              >
                Product
              </label>

              <select
                id="sale-product"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-950"
              >
                <option value="">Select product</option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.stock_quantity <= 0}
                  >
                    {product.name}
                    {product.sku ? ` (${product.sku})` : ""} —{" "}
                    {currency} {Number(product.price).toLocaleString()} — Stock{" "}
                    {Number(product.stock_quantity).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sale-quantity"
                className="text-sm font-medium text-slate-700"
              >
                Quantity
              </label>

              <input
                id="sale-quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-950"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addLine}
                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 md:w-auto"
              >
                Add item
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          {lines.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No products added to this sale yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Product
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Price
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Quantity
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Discount
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Total
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {lines.map((line) => {
                    const product = products.find(
                      (item) => item.id === line.product_id
                    );

                    const lineTotal = Math.max(
                      0,
                      line.quantity * line.unit_price - line.discount
                    );

                    return (
                      <tr key={line.product_id}>
                        <td className="px-4 py-4 font-medium text-slate-950">
                          {product?.name || "Product"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {currency}{" "}
                          {line.unit_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.quantity}
                            onChange={(event) =>
                              updateLineQuantity(
                                line.product_id,
                                event.target.value
                              )
                            }
                            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.discount}
                            onChange={(event) =>
                              updateLineDiscount(
                                line.product_id,
                                event.target.value
                              )
                            }
                            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-950">
                          {currency}{" "}
                          {lineTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => removeLine(line.product_id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="sale-discount"
              className="text-sm font-medium text-slate-700"
            >
              Sale discount
            </label>

            <input
              id="sale-discount"
              type="number"
              min="0"
              step="0.01"
              value={saleDiscount}
              onChange={(event) => setSaleDiscount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="sale-tax"
              className="text-sm font-medium text-slate-700"
            >
              Tax
            </label>

            <input
              id="sale-tax"
              type="number"
              min="0"
              step="0.01"
              value={tax}
              onChange={(event) => setTax(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="sale-paid"
              className="text-sm font-medium text-slate-700"
            >
              Amount paid
            </label>

            <input
              id="sale-paid"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="sale-notes"
            className="text-sm font-medium text-slate-700"
          >
            Notes
          </label>

          <textarea
            id="sale-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes about this sale"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
          />
        </div>

        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between py-2 text-sm text-slate-300">
            <span>Subtotal</span>
            <span>
              {currency}{" "}
              {subtotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 text-sm text-slate-300">
            <span>Discount</span>
            <span>
              {currency}{" "}
              {discountAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 text-sm text-slate-300">
            <span>Tax</span>
            <span>
              {currency}{" "}
              {taxAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
<div className="flex items-center justify-between py-2 text-sm text-slate-300">
  <span>COGS</span>

  <span>
    {currency}{" "}
    {totalCOGS.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </span>
</div>


<div className="flex items-center justify-between py-2 text-sm text-emerald-300">
  <span>Gross Profit</span>

  <span>
    {currency}{" "}
    {grossProfit.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </span>
</div>
          <div className="my-2 border-t border-slate-700" />

          <div className="flex items-center justify-between py-2">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">
              {currency}{" "}
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 text-sm text-slate-300">
            <span>Amount paid</span>
            <span>
              {currency}{" "}
              {paidAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 text-sm text-slate-300">
            <span>Balance due</span>
            <span>
              {currency}{" "}
              {balanceDue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading || lines.length === 0}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating sale..." : "Complete sale"}
          </button>
        </div>
      </div>
    </form>
  );
}
