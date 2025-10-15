"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Search, RefreshCw, History } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Demo-Daten für geschlossene Aufträge
const DEMO_ORDERS = [
  {
    id: "10000014",
    geber: "dan",
    ladedatum: "2025-09-18",
    vonPLZ: "84565",
    entladedatum: "2025-09-20",
    nachPLZ: "85309",
    preisKunde: "2.500,00 €",
    preisFF: "1.600,00 €",
    frachtfuehrer: "semet",
    ldm: "30",
    gewicht: "350",
    bemerkung: "test",
    status: "Geschlossen",
  },
  {
    id: "10000011",
    geber: "test",
    ladedatum: "2025-09-17",
    vonPLZ: "89865",
    entladedatum: "2025-09-18",
    nachPLZ: "85301",
    preisKunde: "800,00 €",
    preisFF: "500,00 €",
    frachtfuehrer: "alim",
    ldm: "2",
    gewicht: "10",
    bemerkung: "test",
    status: "Geschlossen",
  },
]

// Demo-Änderungshistorie
const DEMO_HISTORY = [
  { status: "Offen", aktion: "Neu angelegt", datum: "09.09.25, 12:12:31", benutzer: "admin" },
  { status: "Offen", aktion: "Aktualisiert", datum: "09.09.25, 12:13:29", benutzer: "admin" },
  { status: "In Bearbeitung", aktion: "Nur Status geändert", datum: "09.09.25, 12:14:00", benutzer: "admin" },
  { status: "Offen", aktion: "Nur Status geändert", datum: "09.09.25, 19:14:12", benutzer: "admin" },
  { status: "In Bearbeitung", aktion: "Nur Status geändert", datum: "09.09.25, 20:22:43", benutzer: "user" },
  { status: "Offen", aktion: "Nur Status geändert", datum: "09.09.25, 20:49:19", benutzer: "admin" },
  { status: "Offen", aktion: "Aktualisiert", datum: "10.09.25, 22:36:13", benutzer: "admin" },
  { status: "Offen", aktion: "Aktualisiert", datum: "10.09.25, 22:54:04", benutzer: "admin" },
  { status: "Offen", aktion: "Aktualisiert", datum: "12.09.25, 16:43:41", benutzer: "admin" },
  { status: "In Bearbeitung", aktion: "Bearbeitet", datum: "12.10.25, 12:46:54", benutzer: "admin" },
  { status: "Geschlossen", aktion: "Bearbeitet", datum: "12.10.25, 12:47:42", benutzer: "admin" },
]

export default function GeschlosseneAuftragePage() {
  const [searchId, setSearchId] = useState("")

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Geschlossene Aufträge</h1>
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
          <label className="text-sm text-muted-foreground mb-1 block">Ladedatum ab</label>
          <Input type="date" />
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
                <TableCell>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    {order.status}
                  </Badge>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <History className="h-4 w-4 mr-2" />
                            Änderungshistory
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Änderungshistory</DialogTitle>
                            <DialogDescription>Auftrags-ID: {order.id}</DialogDescription>
                          </DialogHeader>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Aktion</TableHead>
                                <TableHead>Datum & Uhrzeit</TableHead>
                                <TableHead>Benutzer</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {DEMO_HISTORY.map((entry, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{entry.status}</TableCell>
                                  <TableCell>{entry.aktion}</TableCell>
                                  <TableCell>{entry.datum}</TableCell>
                                  <TableCell>{entry.benutzer}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </DialogContent>
                      </Dialog>
                      <DropdownMenuItem>Als offen markieren</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">5 Treffer</p>
      </div>
    </div>
  )
}
