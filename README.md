# ijcBIT-cedar-template-editor

This project is a customized fork of the [CEDAR Template Editor](https://github.com/metadatacenter/cedar-template-editor), originally developed by the [CEDAR Project](https://metadatacenter.org/) at Stanford University.

## About the CEDAR Project

The CEDAR project aims to streamline data submission, making it smarter and faster for scientific researchers and analysts. By providing enhanced interfaces, controlled vocabularies, metadata best practices, and analytics, CEDAR improves metadata quality from provider to end user.

The full CEDAR project is available on their [GitHub repository](https://github.com/metadatacenter).

## Purpose of This Fork

Our institute, [IJC](https://www.carrerasresearch.org/), required a tool that could better capture metadata for all processed samples. While CEDAR provided most of the necessary functionality, we made modifications in two key areas:

1. **Look and Feel** - Customizing the UI to match our institute's design and enhancing spreadsheet functionality for bulk sample entry.
2. **Integration with Office 365** - Enabling form submission results to be exported in Excel format and stored in a dedicated SharePoint site.

## Architecture
<img src="doc/architecture/architecture.drawio.svg">

## Key Enhancements

### 1. UI Customization

We modified the front-end module (`cedar-template-editor`) to align with our institute’s branding and improve usability. Additionally, we enhanced the spreadsheet functionality, allowing users to enter multiple samples in a structured tabular format more efficiently.

### 2. Office 365 Integration

To integrate with our existing workflows, we added functionality to export form responses in Excel format and store them in a SharePoint site managed by our IT department.

- **Data Submission:** Responses are still submitted to the CEDAR API ([CEDAR API Reference](https://resource.metadatacenter.org/api/)) but are also sent to SharePoint.
- **Backend Implementation:** A small Node.js backend processes form data, converts it into an Excel file, and uploads it to SharePoint using the [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/use-the-api).

## Setting Up SharePoint Integration

To enable SharePoint integration, follow these steps:

### 1. Configure Microsoft Entra ID (formerly Azure AD)

1. Create an application in your [Microsoft Entra Admin Center](https://entra.microsoft.com/#home).
2. Request admin approval for the `Sites.Selected` API permission.

### 2. Set Up a SharePoint Site

1. Create a SharePoint site for storing form responses.

2. Grant the application access to this site using Microsoft Graph API:

   ```
   POST https://graph.microsoft.com/v1.0/sites/{siteId}/permissions
   {
     "@odata.type": "#microsoft.graph.permission",
     "roles": ["write"],
     "grantedToIdentities": [{
       "application": {
         "id": "{clientId}"  // Your Application's Client ID
       }
     }]
   }
   ```

   Refer to the [Microsoft Graph documentation](https://learn.microsoft.com/en-us/graph/api/site-post-permissions?view=graph-rest-1.0\&tabs=http) for details.

> [!TIP]
   > Obtain the **siteId** using this API call:
   > ```
   > GET https://graph.microsoft.com/v1.0/sites/{tenant-name}.sharepoint.com:/sites/{site-name}
   > ```

  > [!TIP]
   > **site-name**: Extract from your SharePoint site URL.
   > ```
   > https://https://{tenant-name}.sharepoint.com/sites/{site-name}
   > ```

### 3. Configure Backend Authentication

1. Go to **Microsoft Entra Admin Center** → **Clients & Secrets** → **New Client Secret**.

2. Copy the **Client Secret Value** (visible only once).

3. Add an environment variable:

   ```sh
   GRAPH_API_CLIENT_SECRET=your_client_secret_here
   ```

4. Update authentication settings in:

   - `cedar-template-editor/api/src/graphAPI/appSettings.js` → Set **ClientId** and **TenantId**.
   - `cedar-template-editor/api/src/sharepoint/sharepointSettings.js` → Set **siteId** and **driveId**.

  > [!TIP]
  > Retrieve the **driveId** for SharePoint storage:
  >   ```
  >   GET https://graph.microsoft.com/v1.0/sites/{siteId}/drive
  >   ```

## Conclusion

With these enhancements, we have tailored the CEDAR template editor to better serve our institute’s metadata needs while maintaining compatibility with the original CEDAR project. If you have any questions or need support, feel free to reach out!

