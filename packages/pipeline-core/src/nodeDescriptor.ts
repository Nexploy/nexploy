import { z } from 'zod';
import { NodeCategory, NodeId, NodeType } from '@workspace/pipeline-core/node';

export type NodeIconName =
    | 'ArrowUpDown'
    | 'Bell'
    | 'CircleX'
    | 'CloudBackup'
    | 'Container'
    | 'DatabaseZap'
    | 'Download'
    | 'Eraser'
    | 'FileCheck'
    | 'FileSearch'
    | 'FolderInput'
    | 'FolderOutput'
    | 'GitBranch'
    | 'GitCommit'
    | 'GitFork'
    | 'GitMerge'
    | 'Globe'
    | 'GlobeOff'
    | 'Hammer'
    | 'HardDrive'
    | 'HeartPulse'
    | 'KeyRound'
    | 'KeySquare'
    | 'Layers'
    | 'Milestone'
    | 'Network'
    | 'PackageCheck'
    | 'PackagePlus'
    | 'PackageX'
    | 'Play'
    | 'RefreshCw'
    | 'Rocket'
    | 'RotateCcw'
    | 'ScanSearch'
    | 'ScrollText'
    | 'Server'
    | 'ShieldCheck'
    | 'Split'
    | 'Square'
    | 'SquareTerminal'
    | 'Tag'
    | 'Terminal'
    | 'Timer'
    | 'Trash2'
    | 'Upload'
    | 'Variable'
    | 'Webhook'
    | 'Workflow';

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

export interface DescriptorHandle {
    id: string;
    position: HandlePosition;
    labelKey?: string;
    acceptsFrom?: string;
}

export interface NodeOutputField {
    key: string;
    type?: 'input' | 'number' | 'array';
    labelKey?: string;
    descriptionKey?: string;
    internal?: boolean;
}

export interface NodeDescriptor<TConfig = Record<string, unknown>> {
    type: NodeId;
    nodeType?: NodeType;
    category: NodeCategory;
    icon: NodeIconName;
    isStartNode?: boolean;
    isEndNode?: boolean;
    description: string;
    consumesFromUpstream?: string[];
    outputs?: NodeOutputField[];
    configSchema?: z.ZodType<TConfig>;
    handles: {
        inputs: DescriptorHandle[];
        outputs: DescriptorHandle[];
        attachments: DescriptorHandle[];
    };
}
