<?xml version="1.0"?>

<xsl:stylesheet
		version="1.0"
		xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		>
	<xsl:output
			method="html"
			encoding="UTF-8"
			indent="no"
			/>

	<!-- Add a message line - used for both errors and warnings -->
	<xsl:template name="add-messageline">
		<xsl:param name="row">0</xsl:param>
		<tr>
			<td>
				<div>
					<xsl:variable name="type" select="@type"/>
					<xsl:variable name="id" select="@id"/>
					<xsl:variable name="number" select="@number"/>
					<xsl:if test="$type='E'">
						<xsl:attribute name="class">icon-error</xsl:attribute>
					</xsl:if>
					<xsl:if test="$type='A'">
						<xsl:attribute name="class">icon-error</xsl:attribute>
					</xsl:if>
					<xsl:if test="$type='W'">
						<xsl:attribute name="class">icon-warning</xsl:attribute>
					</xsl:if>
					<xsl:if test="$type='S'">
						<xsl:attribute name="class">icon-success</xsl:attribute>
					</xsl:if>
					<xsl:if test="$type='I'">
						<xsl:attribute name="class">icon-info</xsl:attribute>
					</xsl:if>
					<xsl:attribute name="align">absmiddle</xsl:attribute>
				</div>
			</td>
			<td>
				<span>
					<!-- PS: There is special code for invoices in the simulResults.aspx page that is using this special attribute -->
					<xsl:attribute name="id" xml:space="preserve"><xsl:value-of select="@type"/>&#x20;<xsl:value-of select="@number"/>&#x20;<xsl:value-of select="@id"/></xsl:attribute>
					<xsl:value-of select="current()"/>
				</span>
			</td>
		</tr>
	</xsl:template>

	<!-- Set the header of the columns of the line items table -->
	<xsl:template name="set-lineitemheader">
		<tr class="list_header">
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/LINEITEM != ''"><xsl:value-of select="header/LINEITEM"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/ACCOUNT != ''"><xsl:value-of select="header/ACCOUNT"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/ACCOUNT_SHORT_TEXT != ''"><xsl:value-of select="header/ACCOUNT_SHORT_TEXT"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/DESCRIPTION != ''"><xsl:value-of select="header/DESCRIPTION"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/COST_CENTER != ''"><xsl:value-of select="header/COST_CENTER"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/ORDER != ''"><xsl:value-of select="header/ORDER"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/ASSIGNMENT != ''"><xsl:value-of select="header/ASSIGNMENT"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/TAXCODE != ''"><xsl:value-of select="header/TAXCODE"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/AMOUNT != ''"><xsl:value-of select="header/AMOUNT"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
			<td class="list_header_text" align="left"><xsl:choose><xsl:when test="header/ERRORS != ''"><xsl:value-of select="header/ERRORS"/></xsl:when><xsl:otherwise>&#xA0;</xsl:otherwise></xsl:choose></td>
		</tr>
	</xsl:template>

	<!-- Adds a line in the line items table - Adds cells accordingly to what is specified in the set-lineitemheader template -->
	<xsl:template name="add-lineitem">
		<xsl:param name="row">0</xsl:param>
		<tr>
			<xsl:attribute name="class">
				<xsl:if test="$row mod 2 = 1">edr-L1 edr-L</xsl:if>
				<xsl:if test="$row mod 2 = 0">edr-L2 edr-L</xsl:if>
			</xsl:attribute>
			<xsl:choose>
				<xsl:when test="ITM_NUMBER = '999999'">
					<!-- This is the total line --> 
					<td class="list_text" align="right"><xsl:attribute name="colspan">8</xsl:attribute><strong><xsl:value-of select="ACCOUNT_SHORT_TEXT"/></strong></td>
					<td class="list_text" align="right"><strong><xsl:value-of select="AMOUNT"/></strong></td>
				</xsl:when>
				<xsl:otherwise>
					<!-- This is a line item --> 
					<td class="list_text" align="center">
						<xsl:choose>
							<xsl:when test="LINEITEM != ''"><xsl:value-of select="LINEITEM"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="center">
						<xsl:choose>
							<xsl:when test="ACCOUNT != ''"><xsl:value-of select="ACCOUNT"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="left">
						<xsl:choose>
							<xsl:when test="ACCOUNT_SHORT_TEXT != ''"><xsl:value-of select="ACCOUNT_SHORT_TEXT"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="left">
						<xsl:choose>
							<xsl:when test="DESCRIPTION != ''"><xsl:value-of select="DESCRIPTION"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="left">
						<xsl:choose>
							<xsl:when test="COST_CENTER != ''"><xsl:value-of select="COST_CENTER"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="left">
						<xsl:choose>
							<xsl:when test="ORDER != ''"><xsl:value-of select="ORDER"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="left">
						<xsl:choose>
							<xsl:when test="ASSIGNMENT != ''"><xsl:value-of select="ASSIGNMENT"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="center">
						<xsl:choose>
							<xsl:when test="TAXCODE != ''"><xsl:value-of select="TAXCODE"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
					<td class="list_text" align="right">
						<xsl:choose>
							<xsl:when test="AMOUNT != ''"><xsl:value-of select="AMOUNT"/></xsl:when>
							<xsl:otherwise>&#xA0;</xsl:otherwise>
						</xsl:choose>
					</td>
				</xsl:otherwise>
			</xsl:choose>
			<td class="list_text" align="left">
				<xsl:call-template name="get-lineicon">
					<xsl:with-param name="itemnumber" select="ITM_NUMBER"/>
				</xsl:call-template>
			</td>
		</tr>
	</xsl:template>

	<!-- Reconciliate errors/warnings with the line item and outputs the correct icon -->
	<xsl:template name="get-lineicon">
		<xsl:param name="itemnumber">0</xsl:param>
		<xsl:choose>
			<xsl:when test="/SimulationReport/messageset[@id='messages' or @id='errors' or @id='warnings' or @id='informations']/message[$itemnumber=@itemnumber][1]/@type='E'">
				<div class="icon-error">
					<xsl:attribute name="title"><xsl:value-of select="/SimulationReport/messageset[@id='messages']/message[$itemnumber=@itemnumber][1]"/></xsl:attribute>
				</div>
			</xsl:when>
			<xsl:when test="/SimulationReport/messageset[@id='messages' or @id='errors' or @id='warnings' or @id='informations']/message[$itemnumber=@itemnumber][1]/@type='A'">
				<div class="icon-error">
					<xsl:attribute name="title"><xsl:value-of select="/SimulationReport/messageset[@id='messages']/message[$itemnumber=@itemnumber][1]"/></xsl:attribute>
				</div>
			</xsl:when>
			<xsl:when test="/SimulationReport/messageset[@id='messages' or @id='errors' or @id='warnings' or @id='informations']/message[$itemnumber=@itemnumber][1]/@type='W'">
				<div class="icon-warning">
					<xsl:attribute name="title"><xsl:value-of select="/SimulationReport/messageset[@id='messages']/message[$itemnumber=@itemnumber][1]"/></xsl:attribute>
				</div>
			</xsl:when>
			<xsl:when test="/SimulationReport/messageset[@id='messages' or @id='errors' or @id='warnings' or @id='informations']/message[$itemnumber=@itemnumber][1]/@type='I'">
				<div class="icon-info">
					<xsl:attribute name="title"><xsl:value-of select="/SimulationReport/messageset[@id='messages']/message[$itemnumber=@itemnumber][1]"/></xsl:attribute>
				</div>
			</xsl:when>
			<xsl:otherwise>
				<div class="icon-success">
					<xsl:attribute name="title"><xsl:value-of select="/SimulationReport/messageset[@id='messages']/message[$itemnumber=@itemnumber][1]"/></xsl:attribute>
				</div>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>


	<xsl:template match="/">
		<xsl:apply-templates select="SimulationReport"/>
	</xsl:template>

	<!-- Header  -->
	<xsl:template match="/SimulationReport">
		<xsl:apply-templates select="messageset"/>
		<xsl:apply-templates select="lines"/>
	</xsl:template>

	<!-- Messages  -->
	<xsl:template match="/SimulationReport/messageset[@id='warnings' or @id='errors' or @id='informations' or @id='messages']">
		<table cellspacing="0"  cellpadding="0" class="simulationTableSub">
			<xsl:for-each select="message">
				<xsl:call-template name="add-messageline">
					<xsl:with-param name="row" select="position()" />
				</xsl:call-template>
			</xsl:for-each>
		</table>
		<br />
	</xsl:template>

	<!-- Lines -->
	<xsl:template match="/SimulationReport/lines">
		<table cellspacing="0" cellpadding="0" style="border-width: 1px; border-style: solid; border-color: white;" class="simulationTableSub">
			<xsl:call-template name="set-lineitemheader"/>
			<xsl:for-each select="line">
				<xsl:call-template name="add-lineitem">
					<xsl:with-param name="row" select="position()" />
				</xsl:call-template>
			</xsl:for-each>
		</table>
	</xsl:template>

</xsl:stylesheet>