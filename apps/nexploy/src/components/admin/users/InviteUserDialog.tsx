'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { UserPlus, Shield, ShieldOff, Copy, Check } from 'lucide-react';
import { createInvitation } from '@/actions/admin/users.action';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

const inviteFormSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    role: z.enum(['admin', 'user']),
    expiresInHours: z.number().min(1).max(168),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

export function InviteUserDialog() {
    const [open, setOpen] = useState(false);
    const [invitationLink, setInvitationLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const form = useForm<InviteFormData>({
        resolver: zodResolver(inviteFormSchema),
        defaultValues: {
            email: '',
            role: 'user',
            expiresInHours: 24,
        },
    });

    const { execute, isPending } = useAction(createInvitation, {
        onSuccess: ({ data }) => {
            if (data?.invitation) {
                const baseUrl = window.location.origin;
                const link = `${baseUrl}/signup?invitation=${data.invitation.id}&email=${encodeURIComponent(data.invitation.email)}`;
                setInvitationLink(link);
                toast.success('Invitation created successfully');
            }
        },
        onError: ({ error }) => {
            toast.error(error.serverError || 'Failed to create invitation');
        },
    });

    const onSubmit = (data: InviteFormData) => {
        execute(data);
    };

    const handleCopyLink = () => {
        if (invitationLink) {
            navigator.clipboard.writeText(invitationLink);
            setCopied(true);
            toast.success('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setInvitationLink(null);
        setCopied(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 size-4" />
                    Invite User
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite a new user</DialogTitle>
                    <DialogDescription>
                        Create an invitation link that expires after a set time.
                    </DialogDescription>
                </DialogHeader>

                {invitationLink ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Invitation Link</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={invitationLink}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopyLink}
                                >
                                    {copied ? (
                                        <Check className="size-4 text-green-500" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Share this link with the person you want to invite.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                {...form.register('email')}
                            />
                            {form.formState.errors.email && (
                                <p className="text-destructive text-sm">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={form.watch('role')}
                                onValueChange={(value: 'admin' | 'user') =>
                                    form.setValue('role', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">
                                        <div className="flex items-center gap-2">
                                            <ShieldOff className="size-4" />
                                            User - Standard access
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                            <Shield className="size-4" />
                                            Admin - Full access
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Link expires in</Label>
                            <Select
                                value={String(form.watch('expiresInHours'))}
                                onValueChange={(value) =>
                                    form.setValue('expiresInHours', parseInt(value))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 hour</SelectItem>
                                    <SelectItem value="6">6 hours</SelectItem>
                                    <SelectItem value="24">24 hours</SelectItem>
                                    <SelectItem value="48">48 hours</SelectItem>
                                    <SelectItem value="168">7 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Creating...' : 'Create Invitation'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
