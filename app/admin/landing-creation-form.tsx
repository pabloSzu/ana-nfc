export default function LandingCreationForm({ clients, action }: { clients: Array<{ id: string; name: string }>; action: (formData: FormData) => void | Promise<void> }) {
  return (
    <form action={action} className="stack">
      <label className="label">Cliente<select name="client_id"><option value="">Sin cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label className="label">Nombre de la landing<input name="business_name" placeholder="Ej. Aurora Hotel" required /></label>
      <label className="label">URL (opcional)<input name="slug" placeholder="aurora-hotel" /></label>
      <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Si la dejás vacía, se genera sola. La foto, colores y botones de contacto se configuran después, en el editor.</p>
      <button className="btn full" type="submit">Crear y empezar a editar</button>
    </form>
  );
}
