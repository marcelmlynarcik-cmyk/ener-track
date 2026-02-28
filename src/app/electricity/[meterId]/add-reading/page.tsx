import AddReadingForm from './_components/add-reading-form'

type PageProps = {
  params: Promise<{ meterId: string }>
}

export default async function AddReadingPage({ params }: PageProps) {
  const { meterId } = await params

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Pridať Nový Odpočet Elektriny</h1>
      <AddReadingForm meterId={meterId} />
    </div>
  )
}
