export default async function Page({
                                       params,
                                   }: Readonly<{
    params: Promise<{ accountId: string }>
}>) {
    const { accountId } = await params

    return <div className="text-3xl font-semibold">{accountId}</div>;
}
