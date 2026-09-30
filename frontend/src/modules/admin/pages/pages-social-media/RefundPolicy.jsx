import LegalPageEditor from "@/modules/admin/components/LegalPageEditor"

export default function RefundPolicy() {
  return (
    <LegalPageEditor
      pageKey="refund"
      title="Refund Policy"
      description="Manage the Refund Policy content shown across the platform."
      defaultTitle="Refund Policy"
    />
  )
}
