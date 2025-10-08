# System Department

Meta-system agents for creating departments, agents, workflows, and managing documentation

**Created**: 10/8/2025
**Status**: active
**Version**: 1.0.0

## Overview

- **Total Agents**: 4
- **Total Workflows**: 0
- **Integrations**: 0

## Responsibilities

### Creation & Management

- Create new departments with wizard
- Create agents with type auto-detection
- Create workflows with step builder
- Generate and update all documentation

### Registry Management

- Maintain department registry
- Track agent metadata
- Monitor workflow configurations
- Validate system integrity

## Agents (4)

### Specialist (4)

#### Department Creator
- **Name**: `department-creator`
- **Description**: Interactive wizard for creating complete departments with agents, workflows, and documentation
- **Tools**: Task, Read, Write, Bash, Glob

#### Agent Creator
- **Name**: `agent-creator`
- **Description**: Interactive wizard for creating agents within departments - auto-detects agent type and generates implementation
- **Tools**: Task, Read, Write, Edit, Bash

#### Documentation Updater
- **Name**: `documentation-updater`
- **Description**: Auto-generates all documentation from registries - monitors changes and regenerates department docs and command reference
- **Tools**: Read, Write, Bash

#### Workflow Creator
- **Name**: `workflow-creator`
- **Description**: Interactive wizard for creating workflows in any department - auto-detects parallel/sequential steps
- **Tools**: Task, Read, Write, Bash

## Workflows (0)

---

*This document is auto-generated from `config/registries/`. Do not edit manually.*
*Last updated: 2025-10-08T05:39:47.443Z*
