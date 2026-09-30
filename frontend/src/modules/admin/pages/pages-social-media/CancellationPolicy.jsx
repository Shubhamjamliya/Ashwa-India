import LegalPageEditor from "@/modules/admin/components/LegalPageEditor"

export default function CancellationPolicy() {
  return (
    <LegalPageEditor
      pageKey="cancellation"
      title="Cancellation Policy"
      description="Manage the Cancellation Policy for bookings, transport and orders."
      defaultTitle="Cancellation Policy"
    />
  )
}
