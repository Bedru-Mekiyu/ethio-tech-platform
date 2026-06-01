import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataTable, type Column } from "./data-table";

interface TestItem {
  id: string;
  name: string;
  role: string;
}

const columns: Column<TestItem>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role" },
];

const data: TestItem[] = [
  { id: "1", name: "Aster Bekele", role: "Student" },
  { id: "2", name: "Biruk Tadesse", role: "Mentor" },
  { id: "3", name: "Chaltu Abdi", role: "Admin" },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} />
    );
    expect(html).toContain("Name");
    expect(html).toContain("Role");
  });

  it("renders all data rows", () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} pageSize={10} />
    );
    expect(html).toContain("Aster Bekele");
    expect(html).toContain("Biruk Tadesse");
    expect(html).toContain("Chaltu Abdi");
  });

  it("renders empty message when no data", () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={[]} keyExtractor={(item) => item.id} emptyMessage="No users found" />
    );
    expect(html).toContain("No users found");
  });

  it("renders pagination when data exceeds page size", () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} pageSize={2} />
    );
    expect(html).toContain("Page 1 of 2");
  });

  it("renders role table attribute", () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} />
    );
    expect(html).toContain('role="table"');
  });

  it("renders sortable columns with sort icons", () => {
    const html = renderToStaticMarkup(
      <DataTable columns={columns} data={data} keyExtractor={(item) => item.id} />
    );
    expect(html).toContain("chevrons-up-down");
    expect(html).toContain('scope="col"');
  });
});
