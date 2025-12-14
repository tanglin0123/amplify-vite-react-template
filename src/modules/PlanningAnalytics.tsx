import {
  SpaceBetween,
  Container,
  TextContent,
  Header,
  BreadcrumbGroup,
} from "@cloudscape-design/components";

export function PlanningAnalytics() {
  return (
    <SpaceBetween size="m">
      <div style={{ padding: "0" }}>
        <BreadcrumbGroup
          items={[
            { text: "Workspace", href: "#/" },
            { text: "Planning & Analytics", href: "#/planning-analytics" }
          ]}
        />
      </div>
      <div style={{ padding: "0" }}>
        <Container header={<Header variant="h2">Planning & Analytics</Header>}>
          <TextContent>
            <p>Planning & Analytics module coming soon...</p>
          </TextContent>
        </Container>
      </div>
    </SpaceBetween>
  );
}
