"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, LayoutGrid, List } from "lucide-react"
import { OrderFilters } from "@/components/orders/order-filters"
import { OrderTable, type Order } from "@/components/orders/order-table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

// Demo-Daten
const DEMO_ORDERS: Order[] = [
  {
    id: "10000007",
    auftraggeber: "amat",
    ladedatum: "2025-09-05",
    vonPLZ: "85565",
    entladedatum: "2025-10-04",
    nachPLZ: "85309",
    preisKunde: "3.500,00 €",
    preisFF: "1.800,00 €",
    frachtfuehrer: "semet",
    ldm: "30",
    gewicht: "350",
    bemerkung: "test1",
    status: "offen",
    prioritaet: "hoch",
  },
  {
    id: "10000006",
    auftraggeber: "mirigul",
    ladedatum: "2024-12-20",
    vonPLZ: "89865",
    entladedatum: "2025-09-19",
    nachPLZ: "85309",
    preisKunde: "2.000,00 €",
    preisFF: "1.500,00 €",
    frachtfuehrer: "alim",
    ldm: "20",
    gewicht: "200",
    bemerkung: "test",
    status: "offen",
    prioritaet: "normal",
  },
  {
    id: "10000003",
    auftraggeber: "diyar",
    ladedatum: "2025-08-16",
    vonPLZ: "85276",
    entladedatum: "2025-08-14",
    nachPLZ: "85301",
    preisKunde: "15.000,00 €",
    preisFF: "10.000,00 €",
    frachtfuehrer: "diyar",
    ldm: "30",
    gewicht: "3000",
    bemerkung: "test",
    status: "offen",
  },
]

export default function OffeneAuftragePage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order)
    setIsPreviewOpen(true)
  }

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    console.log("[v0] Bulk action:", action, selectedIds)
  }

  const handleNeuerAuftrag = () => {
    router.push("/auftrage/neu")
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offene Aufträge</h1>
          <p className="text-muted-foreground mt-1">{DEMO_ORDERS.length} Aufträge gefunden</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="table" className="gap-2">
                <List className="h-4 w-4" />
                Tabelle
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Karten
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleNeuerAuftrag} className="gap-2">
            <Plus className="h-4 w-4" />
            Neuer Auftrag
          </Button>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters />

      {/* Table */}
      <OrderTable orders={DEMO_ORDERS} onRowClick={handleRowClick} onBulkAction={handleBulkAction} />

      {/* Row Preview Sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Auftragsvorschau</SheetTitle>
            <SheetDescription>Auftrag {selectedOrder?.id}</SheetDescription>
          </SheetHeader>
          {selectedOrder && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Auftraggeber</p>
                  <p className="font-medium">{selectedOrder.auftraggeber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frachtführer</p>
                  <p className="font-medium">{selectedOrder.frachtfuehrer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Von</p>
                  <p className="font-medium">{selectedOrder.vonPLZ}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nach</p>
                  <p className="font-medium">{selectedOrder.nachPLZ}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ladedatum</p>
                  <p className="font-medium">{selectedOrder.ladedatum}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entladedatum</p>
                  <p className="font-medium">{selectedOrder.entladedatum}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preis Kunde</p>
                  <p className="font-medium">{selectedOrder.preisKunde}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preis FF</p>
                  <p className="font-medium">{selectedOrder.preisFF}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LDM</p>
                  <p className="font-medium">{selectedOrder.ldm}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gewicht</p>
                  <p className="font-medium">{selectedOrder.gewicht} kg</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bemerkung</p>
                <p className="font-medium">{selectedOrder.bemerkung || "Keine"}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Details anzeigen</Button>
                <Button variant="outline">Bearbeiten</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
