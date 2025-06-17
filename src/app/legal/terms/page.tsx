import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";

export default function TermsPage() {
  return (
    <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-4xl bg-card text-card-foreground border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold mb-4">
            Terms and Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none text-muted-foreground">
          <p>
            Welcome to FootyGames.co.uk! These terms and conditions outline the rules and regulations for the use of FootyGames.co.uk's Website, located at [Your Website URL].
          </p>
          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use FootyGames.co.uk if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          <h3>Cookies:</h3>
          <p>
            The website uses cookies to help personalize your online experience. By accessing FootyGames.co.uk, you agreed to use the required cookies.
          </p>
          <h3>License:</h3>
          <p>
            Unless otherwise stated, FootyGames.co.uk and/or its licensors own the intellectual property rights for all material on FootyGames.co.uk. All intellectual property rights are reserved. You may access this from FootyGames.co.uk for your own personal use subjected to restrictions set in these terms and conditions.
          </p>
          <p>You must not:</p>
          <ul>
            <li>Republish material from FootyGames.co.uk</li>
            <li>Sell, rent or sub-license material from FootyGames.co.uk</li>
            <li>Reproduce, duplicate or copy material from FootyGames.co.uk</li>
            <li>Redistribute content from FootyGames.co.uk</li>
          </ul>
          <p>
            This Agreement shall begin on the date hereof.
          </p>
          <p>
            Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. FootyGames.co.uk does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of FootyGames.co.uk,its agents and/or affiliates. Comments reflect the views and opinions of the person who posts their views and opinions. To the extent permitted by applicable laws, FootyGames.co.uk shall not be liable for the Comments or for any liability, damages or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.
          </p>
          <p>
            FootyGames.co.uk reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.
          </p>
          <h3>Your Privacy:</h3>
          <p>
            Please read our Privacy Policy.
          </p>
          <h3>Reservation of Rights:</h3>
          <p>
            We reserve the right to request that you remove all links or any particular link to our Website. You approve to immediately remove all links to our Website upon request. We also reserve the right to amen these terms and conditions and it's linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.
          </p>
          <h3>Disclaimer:</h3>
          <p>
            To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:
          </p>
          <ul>
            <li>limit or exclude our or your liability for death or personal injury;</li>
            <li>limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>
            <li>limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>
            <li>exclude any of our or your liabilities that may not be excluded under applicable law.</li>
          </ul>
          <p>
            The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty.
          </p>
          <p>
            As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
