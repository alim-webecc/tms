"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Search, RefreshCw } from "lucide-react"

// Demo-Daten für Aufträge in Bearbeitung
const DEMO_ORDERS = [
  {
    id: "10000005",
    geber: "diyar",
    ladedatum: "2025-09-12",
    vonPLZ: "85276",
    entladedatum: "2025-09-15",
    nachPLZ: "85309",
    preisKunde: "5.000,00 €",
    preisFF: "3.200,00 €",
    frachtfuehrer: "semet",
    ldm: "54",
    gewicht: "254",
    status: "In Bearbeitung",
    bearbeiter: "admin",
  },
]

export default function InBearbeitungPage() {
  const [searchId, setSearchId] = useState("")

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Aufträge in Bearbeitung</h1>
      </div>

      {/* Filter-Bereich */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 bg-card rounded-lg border">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Auftrags-ID</label>
          <Input placeholder="z.B. 100000*" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Auftragsgeber</label>
          <Input placeholder="Name*" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Bearbeiter</label>
          <Input placeholder="Name*" />
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
              <TableHead>Status</TableHead>
              <TableHead>Auftragsgeber</TableHead>
              <TableHead>Ladedatum</TableHead>
              <TableHead>von (PLZ)</TableHead>
              <TableHead>Entladedatum</TableHead>
              <TableHead>nach (PLZ)</TableHead>
              <TableHead>Preis Kunde</TableHead>
              <TableHead>Preis FF</TableHead>
              <TableHead>Frachtführer</TableHead>
              <TableHead>Bearbeiter</TableHead>
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
                <TableCell>
                  <Badge variant="secondary">{order.status}</Badge>
                </TableCell>
                <TableCell>{order.geber}</TableCell>
                <TableCell>{order.ladedatum}</TableCell>
                <TableCell>{order.vonPLZ}</TableCell>
                <TableCell>{order.entladedatum}</TableCell>
                <TableCell>{order.nachPLZ}</TableCell>
                <TableCell>{order.preisKunde}</TableCell>
                <TableCell>{order.preisFF}</TableCell>
                <TableCell>{order.frachtfuehrer}</TableCell>
                <TableCell>{order.bearbeiter}</TableCell>
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
                      <DropdownMenuItem>Als offen markieren</DropdownMenuItem>
                      <DropdownMenuItem>Als geschlossen markieren</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">1 Treffer</p>
      </div>
    </div>
  )
}
