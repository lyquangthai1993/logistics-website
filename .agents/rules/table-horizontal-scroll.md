# Table Horizontal Scroll Pattern & Standard (UI/UX & Code)

> **Authority**: UI/UX Architecture Standard (`ui-ux-flow-designer`, `pencil-ui-designer`, `nextjs-best-practices`)  
> **Source Pattern**: Canonical Flowbite / Tailwind CSS / Shadcn UI Data Table with Horizontal Scroll  
> **Status**: APPROVED & MANDATORY REFERENCE

---

## 1. Canonical Web Implementation (HTML & Tailwind CSS)

Whenever rendering a data table with multiple columns that may exceed container width (e.g. multi-column cargo tables, split view workspaces with side panels, or tablet/mobile screens):

```html
<div class="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
    <table class="w-full text-sm text-left rtl:text-right text-body">
        <thead class="text-sm text-body bg-neutral-secondary-soft border-b rounded-base border-default">
            <tr>
                <th scope="col" class="px-6 py-3 font-medium">Product name</th>
                <th scope="col" class="px-6 py-3 font-medium">Color</th>
                <th scope="col" class="px-6 py-3 font-medium">Category</th>
                <th scope="col" class="px-6 py-3 font-medium">Price</th>
                <th scope="col" class="px-6 py-3 font-medium">Stock</th>
            </tr>
        </thead>
        <tbody>
            <tr class="bg-neutral-primary border-b border-default">
                <th scope="row" class="px-6 py-4 font-medium text-heading whitespace-nowrap">Apple MacBook Pro 17"</th>
                <td class="px-6 py-4">Silver</td>
                <td class="px-6 py-4">Laptop</td>
                <td class="px-6 py-4">$2999</td>
                <td class="px-6 py-4">231</td>
            </tr>
            <tr class="bg-neutral-primary border-b border-default">
                <th scope="row" class="px-6 py-4 font-medium text-heading whitespace-nowrap">Microsoft Surface Pro</th>
                <td class="px-6 py-4">White</td>
                <td class="px-6 py-4">Laptop PC</td>
                <td class="px-6 py-4">$1999</td>
                <td class="px-6 py-4">423</td>
            </tr>
            <tr class="bg-neutral-primary">
                <th scope="row" class="px-6 py-4 font-medium text-heading whitespace-nowrap">Magic Mouse 2</th>
                <td class="px-6 py-4">Black</td>
                <td class="px-6 py-4">Accessories</td>
                <td class="px-6 py-4">$99</td>
                <td class="px-6 py-4">121</td>
            </tr>
        </tbody>
    </table>
</div>
```

---

## 2. Pencil Vector Design Rules (`.pen` Vector Canvas)

> [!IMPORTANT]
> **CRITICAL RULE: The Scrollbar MUST BE INSIDE the Table Container (`relative overflow-x-auto`)!**
> - NEVER place the horizontal scrollbar as a detached, separate card or widget below the table.
> - The scrollbar track & thumb MUST be placed **directly inside the bottom edge of the table card** (`inside table`), seamlessly blending with the table border, exactly as native browser `overflow-x: auto` renders.

### Canvas Layer Structure:
```text
ODCk5 (Table Card Container: fill: #FFFFFF, stroke: #E2E8F0, cornerRadius: 8, clip: true)
├── Toolbar (Title + Actions)
└── Table Card Frame (border rounded-base clip: true)
    ├── Scrollable Viewport (clip: true, layout: vertical)
    │   └── Scrollable Table Content (e.g. width: 860px)
    │       ├── <thead> (Header Row)
    │       └── <tbody> (Data Rows)
    ├── Native Horizontal Scrollbar (directly ABOVE summary row)
    │   └── Track (subtle #F8FAFC) + Thumb (subtle #94A3B8 / #64748B, height: 6-8px)
    └── <tfoot> (Fixed Summary Totals Row: width: fill_container pinned at bottom)
```

---

## 3. Next.js 15+ / React 19 Implementation (Tailwind v4)

```tsx
export function ScrollableDataTable<T>({ columns, data }: DataTableProps<T>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.id} className="px-4 py-3 whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
              {columns.map((col) => (
                <td key={col.id} className="px-4 py-3 whitespace-nowrap">
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
