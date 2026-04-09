import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { DeleteCustomerButton } from "./delete-button";
import { CustomerViewModal } from "./customer-view-modal";

export default async function KundenPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const customers = await prisma.customer.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
          <p className="text-gray-600 mt-1">{customers.length} Kunden gesamt</p>
        </div>
        <Link href="/kunden/neu">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">Noch keine Kunden angelegt.</p>
              <Link href="/kunden/neu">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Kunden anlegen
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firmenname</TableHead>
                  <TableHead>Ansprechpartner</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Ort</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.companyName}</TableCell>
                    <TableCell>{customer.contactPerson ?? "-"}</TableCell>
                    <TableCell>{customer.email ?? "-"}</TableCell>
                    <TableCell>
                      {customer.city ? `${customer.postalCode ?? ""} ${customer.city}`.trim() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CustomerViewModal
                          customer={{
                            id: customer.id,
                            companyName: customer.companyName,
                            contactPerson: customer.contactPerson,
                            street: customer.street,
                            postalCode: customer.postalCode,
                            city: customer.city,
                            email: customer.email,
                            phone: customer.phone,
                            vatId: customer.vatId,
                            notes: customer.notes,
                            totalPrice: customer.totalPrice !== null ? Number(customer.totalPrice) : null,
                            textField: customer.textField,
                          }}
                        />
                        <Link href={`/kunden/${customer.id}`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeleteCustomerButton id={customer.id} name={customer.companyName} />
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
