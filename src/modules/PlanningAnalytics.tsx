import {
  SpaceBetween,
  Container,
  Header,
  BreadcrumbGroup,
} from "@cloudscape-design/components";

interface PlanningAnalyticsProps {
  onNavigateHome?: () => void;
}

export function PlanningAnalytics({ onNavigateHome }: PlanningAnalyticsProps) {

  return (
    <SpaceBetween size="m">
      <div style={{ padding: "0" }}>
        <BreadcrumbGroup
          items={[
            { text: "MyWorkspace", href: "#/" },
            { text: "Planning & Analytics", href: "#/planning-analytics" }
          ]}
          onFollow={(event) => {
            event.preventDefault();
            if (event.detail.href === "#/" && onNavigateHome) {
              onNavigateHome();
            }
          }}
        />
      </div>
      <div style={{ padding: "0" }}>
        <Container header={<Header variant="h2">Planning & Analytics</Header>}>
          <SpaceBetween size="m" direction="vertical">
          </SpaceBetween>
        </Container>
      </div>
    </SpaceBetween>
  );
}
