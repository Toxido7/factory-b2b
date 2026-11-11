import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RequestListProvider, useRequestList } from "./RequestListContext.jsx";

const product = {
  id: "p1",
  slug: "sac",
  name: "Sac",
  sku: "SAC-1",
  images: ["/sac.jpg"],
  price: "100.00",
  finalPrice: "90.00",
  discountPercent: 10,
  minQuantity: 2,
};

function Harness() {
  const list = useRequestList();
  return (
    <>
      <output data-testid="items">{JSON.stringify(list.items)}</output>
      <output data-testid="total">{list.estimatedTotal}</output>
      <button onClick={() => list.addItem(product, 2)}>add</button>
      <button onClick={() => list.addItem(product, 1)}>add-min</button>
      <button onClick={() => list.updateQuantity("p1", 0)}>minimum</button>
      <button onClick={() => list.removeItem("p1")}>remove</button>
      <button onClick={list.clear}>clear</button>
    </>
  );
}

function renderList() {
  return render(
    <RequestListProvider>
      <Harness />
    </RequestListProvider>,
  );
}

function items() {
  return JSON.parse(screen.getByTestId("items").textContent);
}

describe("RequestListContext", () => {
  it("adds a product", async () => {
    renderList();
    await userEvent.click(screen.getByText("add"));
    expect(items()).toHaveLength(1);
  });

  it("merges the same product instead of duplicating it", async () => {
    renderList();
    await userEvent.click(screen.getByText("add"));
    await userEvent.click(screen.getByText("add"));
    expect(items()).toHaveLength(1);
    expect(items()[0].quantity).toBe(4);
  });

  it("never updates quantity below the minimum", async () => {
    renderList();
    await userEvent.click(screen.getByText("add"));
    await userEvent.click(screen.getByText("minimum"));
    expect(items()[0].quantity).toBe(2);
  });

  it("removes a product", async () => {
    renderList();
    await userEvent.click(screen.getByText("add"));
    await userEvent.click(screen.getByText("remove"));
    expect(items()).toEqual([]);
  });

  it("clears the list", async () => {
    renderList();
    await userEvent.click(screen.getByText("add"));
    await userEvent.click(screen.getByText("clear"));
    expect(items()).toEqual([]);
  });

  it("computes estimatedTotal from finalPrice times quantity", async () => {
    renderList();
    await userEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("total")).toHaveTextContent("180");
  });

  it("saves and restores the list from localStorage", async () => {
    const first = renderList();
    await userEvent.click(screen.getByText("add"));
    first.unmount();
    renderList();
    expect(items()[0].productId).toBe("p1");
  });
});
