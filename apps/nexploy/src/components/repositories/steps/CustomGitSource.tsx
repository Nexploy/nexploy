'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { BookMarked, Check, Link2, Search } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import type { GitBranch, GitRepository } from '@workspace/typescript-interface/git/git';

type InspectedRepository = GitRepository & { branches: GitBranch[] };

export function CustomGitSource() {
    const { setValue } = useFormContext();
    const t = useTranslations('repository.steps.customSource');

    const [repositoryUrl, setRepositoryUrl] = useState('');
    const [inspected, setInspected] = useState<InspectedRepository | null>(null);
    const [branch, setBranch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isInspecting, setIsInspecting] = useState(false);

    const applyRepository = (repository: InspectedRepository, selectedBranch: string) => {
        setValue('gitProvider', 'CUSTOM');
        setValue('gitAccountId', undefined);
        setValue('name', repository.fullName);
        setValue(
            'repo',
            {
                id: repository.id,
                name: repository.name,
                fullName: repository.fullName,
                url: repository.url,
                private: false,
                defaultBranch: selectedBranch,
            },
            { shouldValidate: true },
        );
    };

    const inspect = async () => {
        setIsInspecting(true);
        setError(null);
        setInspected(null);

        try {
            const response = await fetch(`/api/git/custom/inspect?repositoryUrl=${encodeURIComponent(repositoryUrl)}`);
            const body = await response.json();

            if (!response.ok) {
                setError(body?.error ?? t('unreachable'));
                return;
            }

            const repository = body as InspectedRepository;
            const initialBranch = repository.defaultBranch;

            setInspected(repository);
            setBranch(initialBranch);
            applyRepository(repository, initialBranch);
        } catch {
            setError(t('unreachable'));
        } finally {
            setIsInspecting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="custom-repository-url">{t('urlLabel')}</Label>
                <div className="flex gap-2">
                    <Input
                        id="custom-repository-url"
                        value={repositoryUrl}
                        onChange={(event) => setRepositoryUrl(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                void inspect();
                            }
                        }}
                        placeholder={t('urlPlaceholder')}
                        className="max-w-xl"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        icon={Search}
                        isLoading={isInspecting}
                        disabled={isInspecting || repositoryUrl.trim().length === 0}
                        onClick={inspect}
                    >
                        {t('check')}
                    </Button>
                </div>
                <p className="text-muted-foreground text-sm">{t('publicOnly')}</p>
                {error && <p className="text-destructive text-sm">{error}</p>}
            </div>

            {inspected && (
                <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Check className="size-4 text-primary" />
                        <BookMarked className="size-4 shrink-0" />
                        <span className="truncate font-medium">{inspected.fullName}</span>
                        <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-muted-foreground text-xs">{inspected.url}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t('branch')}</Label>
                        <Select
                            value={branch}
                            onValueChange={(value) => {
                                setBranch(value);
                                applyRepository(inspected, value);
                            }}
                        >
                            <SelectTrigger className="w-fit min-w-56">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {inspected.branches.map((remoteBranch) => (
                                    <SelectItem key={remoteBranch.name} value={remoteBranch.name}>
                                        {remoteBranch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
}
