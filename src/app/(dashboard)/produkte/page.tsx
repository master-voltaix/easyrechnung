import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { formatEuro } from "@/lib/utils";
import { DeleteProductButton } from "./delete-button";

export default async function ProduktePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const products = await prisma.product.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produkte & Leistungen</h1>
          <p className="text-gray-600 mt-1">{products.length} Einträge gesamt</p>
        </div>
        <Link href="/produkte/neu">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neues Produkt
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">Noch keine Produkte oder Leistungen angelegt.</p>
              <Link href="/produkte/neu">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Erstes Produkt anlegen
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bezeichnung</TableHead>
                  <TableHead>Einheit</TableHead>
                  <TableHead>Preis (netto)</TableHead>
                  <TableHead>MwSt.</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.title}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{formatEuro(Number(product.unitPrice))}</TableCell>
                    <TableCell>{Number(product.vatRate).toFixed(0)} %</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/produkte/${product.id}`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeleteProductButton id={product.id} name={product.title} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
