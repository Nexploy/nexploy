import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Button } from '@workspace/ui/components/button';
import { Activity, FileText, Terminal } from 'lucide-react';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { ContainerTerminal } from '@/components/docker/container/actions/ContainerTerminal';
import { ContainerAttach } from '@/components/docker/container/actions/ContainerAttach';

export function ContainerViewButtons() {
    const { openDialog } = useConfirmationDialogStore();

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
            <ContainerTerminal>
                {({ openConsole }) => (
                    <Button variant="outline" onClick={openConsole}>
                        <Terminal className="hidden lg:block" />
                        Console
                    </Button>
                )}
            </ContainerTerminal>
            <ContainerAttach>
                {({ openAttach }) => (
                    <Button variant="outline" onClick={openAttach}>
                        <Terminal className="hidden lg:block" />
                        Attach
                    </Button>
                )}
            </ContainerAttach>
        </ButtonGroup>
    );
}
