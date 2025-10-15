"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Plus, Search, RefreshCw } from "lucide-react"

// Demo-Daten
const DEMO_ORDERS = [
  {
    id: "10000007",
    geber: "amat",
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
  },
  {
    id: "10000006",
    geber: "mirigul",
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
  },
]

export default function OffeneAuftragePage() {
  const [searchId, setSearchId] = useState("")
  const [searchGeber, setSearchGeber] = useState("")

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Offene Aufträge</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Auftrag
        </Button>
      </div>

      {/* Filter-Bereich */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 bg-card rounded-lg border">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Auftrags-ID</label>
          <Input placeholder="z.B. 100000*" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Auftragsgeber</label>
          <Input placeholder="Name*" value={searchGeber} onChange={(e) => setSearchGeber(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Ladedatum ab</label>
          <Input type="date" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">von (PLZ)</label>
          <Input placeholder="85*" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Entladedatum ab</label>
          <Input type="date" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">nach (PLZ)</label>
          <Input placeholder="30*" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Frachtführer</label>
          <Input placeholder="Firma*" />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="outline" className="gap-2 flex-1 bg-transparent">
            <Search className="h-4 w-4" />
            Suchen
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Auftrags-ID</TableHead>
              <TableHead>Auftragsgeber</TableHead>
              <TableHead>Ladedatum</TableHead>
              <TableHead>von (PLZ)</TableHead>
              <TableHead>Entladedatum</TableHead>
              <TableHead>nach (PLZ)</TableHead>
              <TableHead>Preis Kunde</TableHead>
              <TableHead>Preis FF</TableHead>
              <TableHead>Frachtführer</TableHead>
              <TableHead>LDM</TableHead>
              <TableHead>Gewicht (kg)</TableHead>
              <TableHead>Bemerkung</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEMO_ORDERS.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/auftrage/${order.id}`} className="text-primary hover:underline">
                    {order.id}
                  </Link>
                </TableCell>
                <TableCell>{order.geber}</TableCell>
                <TableCell>{order.ladedatum}</TableCell>
                <TableCell>{order.vonPLZ}</TableCell>
                <TableCell>{order.entladedatum}</TableCell>
                <TableCell>{order.nachPLZ}</TableCell>
                <TableCell>{order.preisKunde}</TableCell>
                <TableCell>{order.preisFF}</TableCell>
                <TableCell>{order.frachtfuehrer}</TableCell>
                <TableCell>{order.ldm}</TableCell>
                <TableCell>{order.gewicht}</TableCell>
                <TableCell>{order.bemerkung}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/auftrage/${order.id}`}>Details anzeigen</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Bearbeiten</DropdownMenuItem>
                      <DropdownMenuItem>Status ändern</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Löschen</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">6 Treffer</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Zurück
          </Button>
          <Button variant="default" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            Weiter
          </Button>
        </div>
      </div>
    </div>
  )
}
