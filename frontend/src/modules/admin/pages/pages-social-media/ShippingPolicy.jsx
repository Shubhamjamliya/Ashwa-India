import LegalPageEditor from "@/modules/admin/components/LegalPageEditor"

export default function ShippingPolicy() {
  return (
    <LegalPageEditor
      pageKey="shipping"
      title="Shipping Policy"
      description="Manage the Shipping Policy content for the accessories store."
      defaultTitle="Shipping Policy"
    />
  )
}
