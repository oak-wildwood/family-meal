# 0003: Host on DigitalOcean Kubernetes, set up with OpenTofu and Helm

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

Server rendering ([0002](0002-angular-ssr-from-the-database.md)) needs somewhere to run a Node
server. The project is also a way to learn Kubernetes, Helm and infrastructure as code, so
"simplest host" is not the only goal; the setup should resemble how real services are run, and
stay cheap.

Options compared (prices as of late 2026, before load balancers and egress):

| Option | Cost | Why not chosen |
|---|---|---|
| Vercel serverless SSR | Free (Hobby) | Teaches no Kubernetes; kept as the fallback |
| GKE / EKS / AKS | ~$73/mo control plane (GKE, EKS) plus ~$25+/mo nodes | Too expensive outside trial credit |
| AWS free plan | Credits, 6 months | The free plan ends and the account closes |
| GCP e2-micro + k3s | Free | 1 GB RAM is too tight for a cluster plus the app |
| Oracle Cloud free tier | Free | Rejected |
| Hetzner + self-installed k3s | ~$5/mo | Cheapest, but no managed control plane |
| **DigitalOcean Kubernetes (DOKS)** | **~$12/mo, one node; control plane free** | **Chosen** |

## Decision

- **DOKS, one small node**, free control plane. Scale by changing the node pool.
- **OpenTofu** (the open-source Terraform fork) describes the cluster and its supporting
  resources, so the whole thing can be created or destroyed with one command.
- **A Helm chart in this repo** describes what runs in the cluster: the SSR Deployment and
  Service, a Horizontal Pod Autoscaler, the tunnel, and a CronJob that reads Supabase every few
  days so the free project never pauses ([0001](0001-supabase-backend.md)).
- **Cloudflare Tunnel** publishes the site over HTTPS without a cloud load balancer (which would
  cost about as much as the node), and Cloudflare's free CDN caches public pages and photos.
- **CI builds the container image** (GitHub Container Registry) and deploys with `helm upgrade`.
- **The chart is developed on a local k3d cluster first.** The DigitalOcean account is created
  only when the chart works locally, because the new-account credit is time-limited.
- **Vercel stays live** until the cluster has been stable for a while, then the cutover moves the
  production URL. Whether the site stays noindex is decided at cutover.

## Consequences

- One node is one point of failure. Acceptable for this site; the CDN keeps cached pages up
  through short outages.
- The project now has cloud credentials. They live in the CI secret store and on the owner's
  machine, never in this repo.
- Running costs start when the sign-up credit ends. See the off-ramp below.

## Off-ramp: when the DigitalOcean credit runs out

Before the credit ends, pick one of these. Supabase and Cloudflare stay on their free plans in
every case, and the app code does not change, because the SSR server is a plain container.

| Option | Monthly cost | Keeps Kubernetes? | Trade-off |
|---|---|---|---|
| **Keep DOKS** | ~$12 | Yes | Simplest; only if the learning or the traffic is worth it |
| **Vercel serverless SSR** | $0 (Hobby) | No | Least work: point Vercel at the SSR build. Hobby limits are generous for a family site |
| **k3s on a home machine** (old laptop, mini PC, Raspberry Pi) + the same Cloudflare Tunnel | $0 plus electricity | Yes, same Helm chart | Site is down when the machine is; the CDN covers cached pages |
| **GCP e2-micro + k3s** | $0 (always-free tier) | Yes, cramped | 1 GB RAM; workable with the CDN absorbing most traffic, but little headroom |
| **Back to prerender + deploy hook** (see [0002](0002-angular-ssr-from-the-database.md)) | $0 | No | No runtime server; each new recipe triggers a build, so it appears after a minute |
| **Destroy and recreate on demand** | ~$0 when off | Yes, when on | `tofu destroy` when idle, `tofu apply` to practice; production then lives on one of the free options |

To keep every option open until then:

- Keep the Vercel project connected, even after cutover.
- Keep the Helm chart free of DigitalOcean-specific pieces (the tunnel makes a cloud load
  balancer unnecessary), so the same chart runs on k3d, a home k3s or any other cluster.
- Keep the infrastructure in OpenTofu, so `tofu destroy` leaves nothing billable behind.
- Set a DigitalOcean billing alert on day one, and note the credit's end date where it will be seen.
