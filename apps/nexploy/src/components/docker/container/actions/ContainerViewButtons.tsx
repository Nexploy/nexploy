import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Button } from '@workspace/ui/components/button';
import { Activity, FileText, Terminal } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ContainerConsole } from '@/components/docker/container/actions/ContainerConsole';

export function ContainerViewButtons() {
    const { openDialog } = useConfirmationDialogStore();

    const handleOpenConsole = () =>
        openDialog({
            closeOnBackground: false,
            title: 'Console',
            props: {
                className: 'sm:max-w-[1425px]',
            },
            content: <ContainerConsole />,
        });

    return (
        <ButtonGroup>
            <Button variant="outline">
                <FileText className="hidden lg:block" />
                Logs
            </Button>
            <Button variant="outline">
                <Activity className="hidden lg:block" />
                Stats
            </Button>
            <Button variant="outline" onClick={handleOpenConsole}>
                <Terminal className="hidden lg:block" />
                Console
            </Button>
        </ButtonGroup>
    );
}
