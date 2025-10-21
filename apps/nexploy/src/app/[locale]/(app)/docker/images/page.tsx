'use client';

import { ArrowUpDown, Calendar, Download, HardDrive, LayoutList, MoreHorizontal, Tag, Trash2, } from 'lucide-react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@workspace/ui/components/table';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';

export default function DockerImagesPage() {
    // const [sorting, setSorting] = useState([]);
    // const [columnFilters, setColumnFilters] = useState([]);
    // const [rowSelection, setRowSelection] = useState({});

    const data = [
        {
            id: '1',
            repository: 'nginx',
            tag: 'latest',
            imageId: 'a72860cb95fd',
            created: '2 days ago',
            size: '142 MB',
            sizeBytes: 142000000,
        },
        {
            id: '2',
            repository: 'node',
            tag: '18-alpine',
            imageId: 'b5e9f4f9c3a1',
            created: '5 days ago',
            size: '174 MB',
            sizeBytes: 174000000,
        },
        {
            id: '3',
            repository: 'postgres',
            tag: '15.2',
            imageId: 'c8d3a9b7e2f4',
            created: '1 week ago',
            size: '379 MB',
            sizeBytes: 379000000,
        },
        {
            id: '4',
            repository: 'redis',
            tag: '7-alpine',
            imageId: 'd9e4b8c6a5f3',
            created: '3 days ago',
            size: '29.8 MB',
            sizeBytes: 29800000,
        },
        {
            id: '5',
            repository: 'mysql',
            tag: '8.0',
            imageId: 'e7f5c9d8b4a2',
            created: '1 week ago',
            size: '521 MB',
            sizeBytes: 521000000,
        },
        {
            id: '6',
            repository: 'python',
            tag: '3.11-slim',
            imageId: 'f8g6d0e9c5b3',
            created: '4 days ago',
            size: '125 MB',
            sizeBytes: 125000000,
        },
    ];

    // const handleDelete = (id) => {
    //     console.log('Delete image:', id);
    // };
    //
    // const handlePull = (repository, tag) => {
    //     console.log('Pull image:', `${repository}:${tag}`);
    // };

    // Définition des colonnes TanStack
    const columns = [
        {
            accessorKey: 'repository',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Repository
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const repository = row.getValue('repository');
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {repository.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{repository}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'tag',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Tag
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                return (
                    <Badge variant="secondary" className="font-mono">
                        {row.getValue('tag')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'imageId',
            header: 'Image ID',
            cell: ({ row }) => {
                return (
                    <code className="text-muted-foreground text-sm">{row.getValue('imageId')}</code>
                );
            },
        },
        {
            accessorKey: 'created',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Créé
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                return (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {row.getValue('created')}
                    </div>
                );
            },
        },
        {
            accessorKey: 'sizeBytes',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Taille
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-2 text-sm">
                        <HardDrive className="text-muted-foreground h-4 w-4" />
                        {row.original.size}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const image = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handlePull(image.repository, image.tag)}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Pull Image
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleDelete(image.id)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    console.log('aze');

    return (
        <div className="flex h-full flex-1 flex-col gap-5 pt-6">
            <div className={'flex gap-3 px-6'}>
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <LayoutList className="text-primary size-7" />
                </div>
                <div className={'flex flex-col'}>
                    <h1 className="text-3xl leading-none font-semibold tracking-tight">
                        Docker Images
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Gérez et visualisez toutes vos images Docker
                    </p>
                </div>
            </div>

            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className="flex flex-col gap-5 pb-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-5 px-6 md:grid-cols-4">
                        <Card className={'py-5'}>
                            <CardHeader className="flex flex-row justify-between space-y-0">
                                <CardTitle className="text-sm font-medium">Total Images</CardTitle>
                                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                    <LayoutList className="text-primary size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.length}</div>
                                <p className="text-muted-foreground text-xs">+2 depuis hier</p>
                            </CardContent>
                        </Card>

                        <Card className={'py-5'}>
                            <CardHeader className="flex flex-row justify-between space-y-0">
                                <CardTitle className="text-sm font-medium">Espace Total</CardTitle>
                                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                    <HardDrive className="text-primary size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1.37 GB</div>
                                <p className="text-muted-foreground text-xs">
                                    70% de 2 GB utilisés
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={'py-5'}>
                            <CardHeader className="flex flex-row justify-between space-y-0">
                                <CardTitle className="text-sm font-medium">
                                    Images Actives
                                </CardTitle>
                                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                    <Tag className="text-primary size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">3</div>
                                <p className="text-muted-foreground text-xs">
                                    En cours d'exécution
                                </p>
                            </CardContent>
                        </Card>

                        <Card className={'py-5'}>
                            <CardHeader className="flex flex-row justify-between space-y-0">
                                <CardTitle className="text-sm font-medium">Dernière MAJ</CardTitle>
                                <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                    <Calendar className="text-primary size-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">2h</div>
                                <p className="text-muted-foreground text-xs">
                                    Image python:3.11-slim
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table avec TanStack */}
                    <Card className={'mx-6'}>
                        <CardHeader>
                            <CardTitle>Images Docker</CardTitle>
                            <CardDescription>
                                Liste complète de toutes vos images Docker locales
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Search */}
                                <div className="flex items-center">
                                    <Input
                                        placeholder="Filtrer par repository..."
                                        value={
                                            table.getColumn('repository')?.getFilterValue() ?? ''
                                        }
                                        onChange={(event) =>
                                            table
                                                .getColumn('repository')
                                                ?.setFilterValue(event.target.value)
                                        }
                                        className="max-w-sm"
                                    />
                                </div>

                                {/* Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <TableRow key={headerGroup.id}>
                                                    {headerGroup.headers.map((header) => {
                                                        return (
                                                            <TableHead key={header.id}>
                                                                {header.isPlaceholder
                                                                    ? null
                                                                    : flexRender(
                                                                          header.column.columnDef
                                                                              .header,
                                                                          header.getContext(),
                                                                      )}
                                                            </TableHead>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableHeader>
                                        <TableBody>
                                            {table.getRowModel().rows?.length ? (
                                                table.getRowModel().rows.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        data-state={
                                                            row.getIsSelected() && 'selected'
                                                        }
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell key={cell.id}>
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext(),
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={columns.length}
                                                        className="h-24 text-center"
                                                    >
                                                        Aucun résultat.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-end space-x-2">
                                    <div className="text-muted-foreground flex-1 text-sm">
                                        {table.getFilteredRowModel().rows.length} image(s) au total
                                    </div>
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            Précédent
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </ScrollAreaWithShadow>
        </div>
    );
}
