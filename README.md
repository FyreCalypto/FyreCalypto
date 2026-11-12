<p align="center">
  <img src="./assets/arcade.svg" width="100%" alt="FyreCalypto · Cybersecurity and networking. A pixel-art packet gremlin watches packets fly past a neon terminal.">
</p>

<p align="center">
  <a href="#whoami">Who am I?</a> &nbsp;·&nbsp;
  <a href="#featured-repositories">Featured repos</a> &nbsp;·&nbsp;
  <a href="#github-stats">GitHub stats</a>
</p>

<img src="./assets/cable.svg" width="100%" alt="">

### whoami

```console
$ whoami
ipjustice
$ cat interests.txt
packet analysis · defensive security · web security
```

I’m curious about what happens after you hit Enter: where packets go, what gets encrypted, and what the logs can tell you when something breaks.

<p align="center">
  <img src="./assets/badges.svg" width="680" alt="DNS, TCP/IP, TLS, HTTP, Wireshark and JavaScript">
</p>

<img src="./assets/cable.svg" width="100%" alt="">

### Featured repositories

<p align="center">
  <a href="https://github.com/FyreCalypto/washpods"><img src="./assets/web-check.svg" width="48%" alt="Web Check mirror · DNS, TLS, and HTTP header diagnostics"></a>
  &nbsp;
  <a href="https://github.com/FyreCalypto/Ultraviolet"><img src="./assets/ultraviolet.svg" width="48%" alt="Ultraviolet fork · Browser requests routed through a service worker proxy"></a>
</p>

- **[Web Check mirror](https://github.com/FyreCalypto/washpods)** · Alicia Sykes’s toolkit for inspecting a site’s DNS records, TLS configuration, and HTTP headers.
- **[Ultraviolet fork](https://github.com/FyreCalypto/Ultraviolet)** · Titanium Network’s browser proxy. A look at how a service worker intercepts and forwards requests.
- **[Hall Pass System](https://github.com/FyreCalypto/hall-pass-system)** · A browser prototype for scheduling passes and tracking arrivals, with different views for staff and students.

<details>
<summary><strong>👾 Open the Packet Gremlin’s lab</strong></summary>

A fresh HTTPS connection over TCP usually goes like this:

```text
DNS lookup → TCP handshake → TLS handshake → encrypted HTTP
```

Try this Wireshark display filter on a capture from your own device. It shows DNS traffic, TCP packets with the SYN flag set, and traffic recognized as TLS.

```text
dns or tcp.flags.syn == 1 or tls
```

</details>

<img src="./assets/cable.svg" width="100%" alt="">

### GitHub stats

<p align="center">
  <a href="https://github.com/FyreCalypto?tab=repositories"><img src="./assets/activity.svg" width="720" alt="Dated GitHub search snapshot: 51 indexed public repositories, including 19 non-forks and 32 forks."></a>
</p>

<p align="center">
  <a href="https://github.com/FyreCalypto#js-contribution-activity-description">Live contribution graph ↗</a> &nbsp;·&nbsp;
  <a href="https://github.com/FyreCalypto?tab=repositories">All repositories ↗</a>
</p>
