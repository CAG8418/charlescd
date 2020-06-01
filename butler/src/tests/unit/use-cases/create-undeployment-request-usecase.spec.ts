import { Test } from '@nestjs/testing'
import { QueryFailedError, Repository } from 'typeorm'
import { CreateUndeploymentDto } from '../../../app/api/deployments/dto'
import {
    ComponentDeploymentEntity, DeploymentEntity,
    ModuleDeploymentEntity, QueuedUndeploymentEntity, UndeploymentEntity, CircleDeploymentEntity
} from '../../../app/api/deployments/entity'
import { QueuedPipelineStatusEnum } from '../../../app/api/deployments/enums'
import {
    ComponentDeploymentsRepository,
    QueuedDeploymentsRepository
} from '../../../app/api/deployments/repository'
import { PipelineDeploymentsService, PipelineErrorHandlerService, PipelineQueuesService } from '../../../app/api/deployments/services'
import { CreateUndeploymentRequestUsecase } from '../../../app/api/deployments/use-cases'
import { MooveService } from '../../../app/core/integrations/moove'
import { ConsoleLoggerService } from '../../../app/core/logs/console'
import { StatusManagementService } from '../../../app/core/services/deployments'
import {
    ComponentDeploymentsRepositoryStub,
    ComponentsRepositoryStub,
    DeploymentsRepositoryStub,
    QueuedDeploymentsRepositoryStub,
    QueuedUndeploymentsRepositoryStub,
    UndeploymentsRepositoryStub
} from '../../stubs/repository'
import {
    ConsoleLoggerServiceStub, MooveServiceStub,
    PipelineDeploymentsServiceStub, PipelineErrorHandlerServiceStub,
    PipelineQueuesServiceStub, StatusManagementServiceStub
} from '../../stubs/services'
import { QueuedDeploymentsConstraints } from '../../../app/core/integrations/databases/constraints'

describe('CreateUndeploymentRequestUsecase', () => {

    let createUndeploymentRequestUsecase: CreateUndeploymentRequestUsecase
    let deploymentsRepository: Repository<DeploymentEntity>
    let undeploymentsRepository: Repository<UndeploymentEntity>
    let createUndeploymentDto: CreateUndeploymentDto
    let componentDeploymentRepository: ComponentDeploymentsRepository
    let deployment: DeploymentEntity
    let undeployment: UndeploymentEntity
    let moduleDeployments: ModuleDeploymentEntity[]
    let componentDeployments: ComponentDeploymentEntity[]
    let pipelineQueuesService: PipelineQueuesService
    let queuedUndeployments: QueuedUndeploymentEntity[]
    let statusManagementService: StatusManagementService
    let mooveService: MooveService
    let queuedUndeploymentRepository: Repository<QueuedUndeploymentEntity>

    beforeEach(async () => {

        const module = await Test.createTestingModule({
            providers: [
                CreateUndeploymentRequestUsecase,
                { provide: 'DeploymentEntityRepository', useClass: DeploymentsRepositoryStub },
                { provide: 'UndeploymentEntityRepository', useClass: UndeploymentsRepositoryStub },
                { provide: ComponentDeploymentsRepository, useClass: ComponentDeploymentsRepositoryStub },
                { provide: QueuedDeploymentsRepository, useClass: QueuedDeploymentsRepositoryStub },
                { provide: PipelineQueuesService, useClass: PipelineQueuesServiceStub },
                { provide: StatusManagementService, useClass: StatusManagementServiceStub },
                { provide: ConsoleLoggerService, useClass: ConsoleLoggerServiceStub },
                { provide: MooveService, useClass: MooveServiceStub },
                { provide: 'ComponentEntityRepository', useClass: ComponentsRepositoryStub },
                { provide: 'QueuedUndeploymentEntityRepository', useClass: QueuedUndeploymentsRepositoryStub },
                { provide: PipelineDeploymentsService, useClass: PipelineDeploymentsServiceStub },
                { provide: PipelineErrorHandlerService, useClass: PipelineErrorHandlerServiceStub },
            ]
        }).compile()

        createUndeploymentRequestUsecase = module.get<CreateUndeploymentRequestUsecase>(CreateUndeploymentRequestUsecase)
        pipelineQueuesService = module.get<PipelineQueuesService>(PipelineQueuesService)
        deploymentsRepository = module.get<Repository<DeploymentEntity>>('DeploymentEntityRepository')
        undeploymentsRepository = module.get<Repository<UndeploymentEntity>>('UndeploymentEntityRepository')
        statusManagementService = module.get<StatusManagementService>(StatusManagementService)
        queuedUndeploymentRepository = module.get<Repository<QueuedUndeploymentEntity>>('QueuedUndeploymentEntityRepository')
        mooveService = module.get<MooveService>(MooveService)
        componentDeploymentRepository = module.get<ComponentDeploymentsRepository>(ComponentDeploymentsRepository)

        createUndeploymentDto = new CreateUndeploymentDto('dummy-author-id')

        componentDeployments = [
            new ComponentDeploymentEntity(
                'dummy-id',
                'dummy-name',
                'dummy-img-url',
                'dummy-img-tag'
            ),
            new ComponentDeploymentEntity(
                'dummy-id',
                'dummy-name2',
                'dummy-img-url2',
                'dummy-img-tag2'
            )
        ]

        moduleDeployments = [
            new ModuleDeploymentEntity(
                'dummy-id',
                'helm-repository',
                componentDeployments
            )
        ]

        deployment = new DeploymentEntity(
            'dummy-deployment-id',
            'dummy-application-name',
            moduleDeployments,
            'dummy-author-id',
            'dummy-description',
            'dummy-callback-url',
            null,
            false,
            'dummy-circle-id'
        )

        deployment.circle = new CircleDeploymentEntity('header-value')

        undeployment = new UndeploymentEntity(
            'dummy-author-id',
            deployment,
            'dummy-circle-id'
        )

        queuedUndeployments = [
            new QueuedUndeploymentEntity(
                'dummy-id',
                componentDeployments[0].id,
                QueuedPipelineStatusEnum.RUNNING,
                'dummy-id-2'
            ),
            new QueuedUndeploymentEntity(
                'dummy-id',
                componentDeployments[1].id,
                QueuedPipelineStatusEnum.QUEUED,
                'dummy-id-3'
            )
        ]
    })

    describe('execute', () => {
        it('should return the correct read dto for a given create dto', async () => {

            jest.spyOn(deploymentsRepository, 'findOneOrFail')
                .mockImplementation(() => Promise.resolve(deployment))
            jest.spyOn(undeploymentsRepository, 'save')
                .mockImplementation(() => Promise.resolve(undeployment))
            jest.spyOn(pipelineQueuesService, 'getQueuedPipelineStatus')
                .mockImplementation(() => Promise.resolve(QueuedPipelineStatusEnum.RUNNING))

            expect(await createUndeploymentRequestUsecase.execute(createUndeploymentDto, 'dummy-deployment-id', 'dummy-circle-id'))
                .toEqual(undeployment.toReadDto())
        })

        it('should handle duplicated module undeployment', async () => {

            jest.spyOn(deploymentsRepository, 'findOneOrFail')
                .mockImplementation(() => Promise.resolve(deployment))
            jest.spyOn(undeploymentsRepository, 'save')
                .mockImplementation(() => Promise.resolve(undeployment))

            jest.spyOn(queuedUndeploymentRepository, 'save')
                .mockImplementationOnce(
                    () => { throw new QueryFailedError('query', [], { constraint: QueuedDeploymentsConstraints.UNIQUE_RUNNING_MODULE }) }
                )
                .mockImplementationOnce(() => Promise.resolve(queuedUndeployments[0]))

            expect(await createUndeploymentRequestUsecase.execute(createUndeploymentDto, 'dummy-deployment-id', 'dummy-circle-id'))
                .toEqual(undeployment.toReadDto())
        })
    })
})
