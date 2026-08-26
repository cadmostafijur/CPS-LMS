"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminResourceManager, StatusBadge } from "@/features/admin/admin-resource-manager";
import { bffFetch, ApiError } from "@/lib/api";

export function InventoryAdminManager() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [type, setType] = useState("IN");
  const [reason, setReason] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  async function adjust() {
    try {
      await bffFetch("/api/lms/admin/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          itemId,
          quantity: Number(quantity),
          type,
          reason: reason || null,
        }),
      });
      toast.success("Stock updated");
      setAdjustOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Adjust failed");
    }
  }

  return (
    <div className="space-y-8" key={reloadKey}>
      <AdminResourceManager
        title="Inventory items"
        description="SKUs, stock levels, and warehouse placement."
        uid="inventory-items"
        columns={[
          { key: "sku", label: "SKU" },
          { key: "name", label: "Name" },
          { key: "quantity", label: "Qty" },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge value={r.status} />,
          },
          { key: "warehouse.name", label: "Warehouse" },
        ]}
        fields={[
          { key: "name", label: "Name", type: "text" },
          { key: "sku", label: "SKU", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "unit", label: "Unit", type: "text" },
          { key: "quantity", label: "Quantity", type: "number" },
          { key: "minStock", label: "Min stock", type: "number" },
          { key: "reorderLevel", label: "Reorder level", type: "number" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"],
          },
        ]}
        createDefaults={{ unit: "pcs", quantity: 0, minStock: 5, reorderLevel: 10, status: "IN_STOCK" }}
      />
      <div className="-mt-4">
        <Button onClick={() => setAdjustOpen(true)}>Adjust stock</Button>
      </div>

      <AdminResourceManager
        title="Warehouses"
        description="Physical or virtual stock locations."
        uid="warehouses"
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "address", label: "Address" },
          {
            key: "isActive",
            label: "Active",
            render: (r) => (r.isActive !== false ? "Yes" : "No"),
          },
        ]}
        fields={[
          { key: "name", label: "Name", type: "text" },
          { key: "code", label: "Code", type: "text" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "isActive", label: "Active", type: "boolean" },
        ]}
        createDefaults={{ isActive: true }}
      />

      <AdminResourceManager
        title="Stock movements"
        description="Audit trail of stock in/out/adjustments."
        uid="stock-movements"
        readOnly
        columns={[
          { key: "type", label: "Type" },
          { key: "item.name", label: "Item" },
          { key: "quantity", label: "Qty" },
          { key: "previousQuantity", label: "Before" },
          { key: "newQuantity", label: "After" },
          { key: "reason", label: "Reason" },
        ]}
        fields={[]}
      />

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust stock</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Item ID</Label>
              <Input value={itemId} onChange={(e) => setItemId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">IN</SelectItem>
                  <SelectItem value="OUT">OUT</SelectItem>
                  <SelectItem value="ADJUSTMENT">ADJUSTMENT (set absolute)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button onClick={adjust} disabled={!itemId}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
