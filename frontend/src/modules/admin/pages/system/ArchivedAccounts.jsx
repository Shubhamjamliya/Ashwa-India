import { UserX, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"

const archivedAccounts = [
  { name: "Ravi Sharma", email: "ravi.sharma@example.com", role: "Horse Seller", archivedOn: "2026-08-12" },
  { name: "Meera Traders", email: "meera.traders@example.com", role: "Store Seller", archivedOn: "2026-07-30" },
  { name: "Dr. Anil Kapoor", email: "anil.kapoor@example.com", role: "Service Provider", archivedOn: "2026-07-02" },
]

export default function ArchivedAccounts() {
  return (
    <div className="px-4 pb-10 lg:px-6 pt-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
            <UserX className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Archived Accounts</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Deactivated or suspended accounts across the platform</p>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Name</th>
                  <th className="text-left font-semibold px-5 py-3">Email</th>
                  <th className="text-left font-semibold px-5 py-3">Role</th>
                  <th className="text-left font-semibold px-5 py-3">Archived On</th>
                  <th className="text-right font-semibold px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {archivedAccounts.map((acc) => (
                  <tr key={acc.email} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-900">{acc.name}</td>
                    <td className="px-5 py-3 text-neutral-600">{acc.email}</td>
                    <td className="px-5 py-3 text-neutral-600">{acc.role}</td>
                    <td className="px-5 py-3 text-neutral-500">{acc.archivedOn}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="outline" size="sm">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {archivedAccounts.length === 0 && (
            <CardContent className="text-center py-10 text-neutral-500">No archived accounts.</CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
