from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import AthleteProfileViewSet, OrganizationViewSet, TeamViewSet, UserSetupViewSet, UserProfileViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Catalog ViewSet'leri
from catalog.views import (
    TestDefinitionViewSet,
    TestProtocolViewSet,
    TestProtocolAssignmentViewSet,
    TestMetricBindingViewSet,
    TestMethodBindingViewSet,
    TestEvidenceBindingViewSet,
    TestNormBindingViewSet,
    TestFormulaBindingViewSet,
    PopulationDefinitionViewSet,
    PopulationSportContextViewSet,
    NormSetViewSet,
    ValidationRuleViewSet
)

# Planning ViewSet'leri
from planning.views import (
    TestSessionViewSet,
    TestSessionPlanRevisionViewSet,
    TestSessionParticipantViewSet,
    TestSessionTestItemViewSet,
    ParticipantTestAssignmentViewSet,
    TestSessionStationViewSet,
    TestSessionSlotViewSet,
    TestSessionStaffAssignmentViewSet,
    TestSessionResourceRequirementViewSet,
    TestSessionGateEvaluationViewSet,
    ExecutionHandoffViewSet
)

# Execution ViewSet'leri
from execution.views import (
    ExecutionSessionViewSet,
    ExecutionRunViewSet,
    ExecutionAttemptViewSet,
    ExecutionDeviationViewSet
)

# Measurement ViewSet'leri
from measurement.views import (
    ResultBatchViewSet,
    MeasurementResultViewSet,
    DerivedMeasurementResultViewSet
)

# Formula ViewSet'leri
from formula.views import FormulaCalculateViewSet

# Norm ViewSet'leri
from norm.views import NormCalculateViewSet

# ----- Catalog Router -----
catalog_router = DefaultRouter()
catalog_router.register(r'test-definitions', TestDefinitionViewSet, basename='testdefinition')
catalog_router.register(r'protocols', TestProtocolViewSet, basename='testprotocol')
catalog_router.register(r'test-protocol-assignments', TestProtocolAssignmentViewSet, basename='testprotocolassignment')
catalog_router.register(r'test-metric-bindings', TestMetricBindingViewSet, basename='testmetricbinding')
catalog_router.register(r'test-method-bindings', TestMethodBindingViewSet, basename='testmethodbinding')
catalog_router.register(r'test-evidence-bindings', TestEvidenceBindingViewSet, basename='testevidencebinding')
catalog_router.register(r'test-norm-bindings', TestNormBindingViewSet, basename='testnormsbinding')
catalog_router.register(r'test-formula-bindings', TestFormulaBindingViewSet, basename='testformulabinding')
catalog_router.register(r'populations', PopulationDefinitionViewSet, basename='populationdefinition')
catalog_router.register(r'population-sport-contexts', PopulationSportContextViewSet, basename='populationsportcontext')
catalog_router.register(r'norm-sets', NormSetViewSet, basename='normset')
catalog_router.register(r'validation-rules', ValidationRuleViewSet, basename='validationrule')

# ----- Planning Router -----
planning_router = DefaultRouter()
planning_router.register(r'test-sessions', TestSessionViewSet, basename='testsession')
planning_router.register(r'test-session-revisions', TestSessionPlanRevisionViewSet, basename='testsessionplanrevision')
planning_router.register(r'test-session-participants', TestSessionParticipantViewSet, basename='testsessionparticipant')
planning_router.register(r'test-session-test-items', TestSessionTestItemViewSet, basename='testsessiontestitem')
planning_router.register(r'participant-test-assignments', ParticipantTestAssignmentViewSet, basename='participanttestassignment')
planning_router.register(r'test-session-stations', TestSessionStationViewSet, basename='testsessionstation')
planning_router.register(r'test-session-slots', TestSessionSlotViewSet, basename='testsessionslot')
planning_router.register(r'test-session-staff', TestSessionStaffAssignmentViewSet, basename='testsessionstaffassignment')
planning_router.register(r'test-session-resources', TestSessionResourceRequirementViewSet, basename='testsessionresourcerequirement')
planning_router.register(r'test-session-gates', TestSessionGateEvaluationViewSet, basename='testsessiongateevaluation')
planning_router.register(r'execution-handoffs', ExecutionHandoffViewSet, basename='executionhandoff')

# ----- Execution Router -----
execution_router = DefaultRouter()
execution_router.register(r'sessions', ExecutionSessionViewSet, basename='executionsession')
execution_router.register(r'runs', ExecutionRunViewSet, basename='executionrun')
execution_router.register(r'attempts', ExecutionAttemptViewSet, basename='executionattempt')
execution_router.register(r'deviations', ExecutionDeviationViewSet, basename='executiondeviation')

# ----- Measurement Router -----
measurement_router = DefaultRouter()
measurement_router.register(r'batches', ResultBatchViewSet, basename='resultbatch')
measurement_router.register(r'results', MeasurementResultViewSet, basename='measurementresult')
measurement_router.register(r'derived', DerivedMeasurementResultViewSet, basename='derivedmeasurementresult')

# ----- Formula Router -----
formula_router = DefaultRouter()
formula_router.register(r'calculate', FormulaCalculateViewSet, basename='formula-calculate')

# ----- Norm Router -----
norm_router = DefaultRouter()
norm_router.register(r'calculate', NormCalculateViewSet, basename='norm-calculate')

# ----- 📌 Core Router -----
core_router = DefaultRouter()
core_router.register(r'athlete-profiles', AthleteProfileViewSet, basename='athleteprofile')
core_router.register(r'organizations', OrganizationViewSet, basename='organization')
core_router.register(r'teams', TeamViewSet, basename='team')
core_router.register(r'user-setup', UserSetupViewSet, basename='user-setup')
core_router.register(r'user-profile', UserProfileViewSet, basename='user-profile')  # 📌 EKLENDI

# ----- URL Patterns -----
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/core/', include(core_router.urls)),
    path('api/v1/catalog/', include(catalog_router.urls)),
    path('api/v1/planning/', include(planning_router.urls)),
    path('api/v1/execution/', include(execution_router.urls)),
    path('api/v1/measurement/', include(measurement_router.urls)),
    path('api/v1/formula/', include(formula_router.urls)),
    path('api/v1/norm/', include(norm_router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/reporting/', include('reporting.urls')),
    path('api/v1/reporting/', include('reporting.urls')),
]