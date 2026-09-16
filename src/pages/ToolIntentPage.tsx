/**
 * Crawlable tool-intent marketing pages (timeline maker, TimelineJS alternative, frise).
 * Copy is the same source used by Cloud Functions prerender HTML.
 */

import { Helmet } from 'react-helmet-async';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { TopNavBar } from '../components/TopNavBar';
import { useAuth } from '../contexts/AuthContext';
import { OG_IMAGE_URL, toolIntentUrl } from '../utils/urls';
import {
  CREATE_TIMELINE_PATH,
  getToolIntentPage,
  type ToolIntentSlug,
} from '../../functions/src/lib/toolIntentContent';

interface ToolIntentPageProps {
  slug: ToolIntentSlug;
}

export function ToolIntentPage({ slug }: ToolIntentPageProps) {
  const page = getToolIntentPage(slug);
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  if (!page) {
    return null;
  }

  const canonical = toolIntentUrl(page.slug);
  const publishedFaqs = page.faqs.filter((faq) => !faq.todo);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      description: page.metaDescription,
      url: canonical,
      inLanguage: page.lang,
    },
    ...(publishedFaqs.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: publishedFaqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          },
        ]
      : []),
  ];

  const handleCreate = () => {
    if (user && userProfile) {
      navigate(CREATE_TIMELINE_PATH);
      return;
    }
    navigate('/login', {
      state: { from: { pathname: '/browse', search: '?create=1' } },
    });
  };

  const sectionTitleSx = {
    color: 'var(--page-text-primary)',
    fontWeight: 700,
    mt: 5,
    mb: 2,
  };

  return (
    <>
      <Helmet>
        <html lang={page.lang} />
        <title>{page.title}</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.metaDescription} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Box
        data-testid="tool-intent-page"
        data-slug={page.slug}
        sx={{
          minHeight: '100vh',
          bgcolor: 'var(--page-bg)',
          color: 'var(--page-text-primary)',
        }}
      >
        <TopNavBar />
        <Container maxWidth="md" component="main" sx={{ py: { xs: 5, md: 8 } }}>
          <article>
            <Typography
              variant="h1"
              component="h1"
              data-testid="tool-intent-h1"
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              {page.h1}
            </Typography>
            <Typography
              component="p"
              sx={{
                color: 'var(--page-text-secondary)',
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                lineHeight: 1.6,
                mb: 2,
              }}
            >
              {page.lead}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleCreate}
                data-testid="tool-intent-cta-create"
                sx={{
                  bgcolor: '#5b5bd6',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#4a4ac4' },
                }}
              >
                {page.createCta}
              </Button>
              <Button
                variant="outlined"
                size="large"
                href={page.proofHref}
                data-testid="tool-intent-cta-fork"
                sx={{
                  borderColor: 'var(--page-border)',
                  color: 'var(--page-text-primary)',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {page.forkCta}
              </Button>
            </Stack>

            <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
              {page.bestForTitle}
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'var(--page-text-secondary)', lineHeight: 1.7 }}>
              {page.bestFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </Box>

            <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
              {page.notForTitle}
            </Typography>
            <Box component="ul" sx={{ pl: 3, color: 'var(--page-text-secondary)', lineHeight: 1.7 }}>
              {page.notFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </Box>

            {page.steps && page.stepsTitle && (
              <>
                <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
                  {page.stepsTitle}
                </Typography>
                <Box component="ol" sx={{ pl: 3, color: 'var(--page-text-secondary)', lineHeight: 1.7 }}>
                  {page.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </Box>
              </>
            )}

            {page.compare && (
              <>
                <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
                  {page.compare.caption}
                </Typography>
                <Box
                  sx={{
                    overflowX: 'auto',
                    border: '1px solid var(--page-border)',
                    borderRadius: 1,
                  }}
                >
                  <Table size="small" aria-label={page.compare.caption}>
                    <TableHead>
                      <TableRow>
                        {page.compare.headers.map((header) => (
                          <TableCell
                            key={header || 'feature'}
                            sx={{ fontWeight: 700, color: 'var(--page-text-primary)' }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {page.compare.rows.map((row) => (
                        <TableRow key={row[0]}>
                          {row.map((cell, index) => (
                            <TableCell
                              key={`${row[0]}-${index}`}
                              component={index === 0 ? 'th' : 'td'}
                              scope={index === 0 ? 'row' : undefined}
                              sx={{ color: 'var(--page-text-secondary)', verticalAlign: 'top' }}
                            >
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}

            {page.whenKeep && (
              <>
                <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
                  {page.whenKeep.title}
                </Typography>
                <Typography sx={{ color: 'var(--page-text-secondary)', lineHeight: 1.7 }}>
                  {page.whenKeep.body}
                </Typography>
              </>
            )}

            {page.whenSwitch && (
              <>
                <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
                  {page.whenSwitch.title}
                </Typography>
                <Typography sx={{ color: 'var(--page-text-secondary)', lineHeight: 1.7 }}>
                  {page.whenSwitch.body}
                </Typography>
              </>
            )}

            <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
              {page.proofLabel}
            </Typography>
            <Typography sx={{ color: 'var(--page-text-secondary)', lineHeight: 1.7, mb: 1 }}>
              {page.proofNote}
            </Typography>
            <Link
              href={page.proofHref}
              data-testid="tool-intent-demo-link"
              sx={{ color: 'var(--page-accent)', fontWeight: 600 }}
            >
              {page.proofTitle}
            </Link>

            <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
              FAQ
            </Typography>
            <Box component="dl" sx={{ m: 0 }}>
              {page.faqs.map((faq) => (
                <Box key={faq.question} sx={{ mb: 2.5 }}>
                  <Typography component="dt" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {faq.question}
                  </Typography>
                  <Typography
                    component="dd"
                    data-todo={faq.todo ? 'product-truth' : undefined}
                    sx={{
                      m: 0,
                      color: 'var(--page-text-secondary)',
                      lineHeight: 1.7,
                      fontStyle: faq.todo ? 'italic' : 'normal',
                    }}
                  >
                    {faq.answer}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="h2" component="h2" sx={{ ...sectionTitleSx, fontSize: '1.35rem' }}>
              {page.lang === 'fr' ? 'Liens' : 'More'}
            </Typography>
            <Stack component="ul" spacing={1} sx={{ pl: 3, m: 0 }}>
              {page.internalLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('/') && !link.href.startsWith('//') ? (
                    <Link
                      component={RouterLink}
                      to={link.href}
                      sx={{ color: 'var(--page-accent)' }}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <Link href={link.href} sx={{ color: 'var(--page-accent)' }}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </Stack>
          </article>
        </Container>
      </Box>
    </>
  );
}

export default ToolIntentPage;
