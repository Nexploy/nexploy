import { ToolGroup } from './types';
import { containersGroup } from './groups/containers.group';
import { imagesGroup } from './groups/images.group';
import { volumesGroup } from './groups/volumes.group';
import { networksGroup } from './groups/networks.group';
import { composeGroup } from './groups/compose.group';
import { swarmGroup } from './groups/swarm.group';
import { repositoriesGroup } from './groups/repositories.group';
import { registriesGroup } from './groups/registries.group';
import { sslGroup } from './groups/ssl.group';
import { environmentsGroup } from './groups/environments.group';

export const toolGroups: ToolGroup[] = [
    // Docker
    containersGroup,
    imagesGroup,
    volumesGroup,
    networksGroup,
    composeGroup,
    swarmGroup,
    // Nexploy
    repositoriesGroup,
    registriesGroup,
    sslGroup,
    environmentsGroup,
];
