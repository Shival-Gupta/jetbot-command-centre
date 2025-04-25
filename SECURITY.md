# Security Guidelines

## Reporting Issues

For security vulnerabilities, please:
1. **Don't** open a public issue
2. Email details to your team lead
3. Include reproduction steps if possible

## Best Practices

### Production Deployment
- Change default login credentials
- Use HTTPS if exposed to internet
- Keep system and packages updated

### Development
- Don't commit sensitive data
- Use environment variables for secrets
- Keep Docker base images updated

## Access Control

- USB devices need dialout group access
- Docker needs docker group membership
- Web interface requires authentication

## Updates

- Security patches released via Docker images
- Watch GitHub releases for updates
- Update system packages regularly