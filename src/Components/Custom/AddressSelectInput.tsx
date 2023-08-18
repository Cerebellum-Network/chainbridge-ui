import React from "react";
import {SelectInput} from "@chainsafe/common-components";
import {useField} from "formik";
import {createStyles, ITheme, makeStyles} from "@chainsafe/common-theme";
import {DestinationChainContext} from "../../Contexts/Adaptors/interfaces";

const useStyles = makeStyles(({constants}: ITheme) =>
    createStyles({
        root: {
            margin: "24px 0px"
        },
    })
);

interface IAddressSelectInput {
    addresses: DestinationChainContext["addresses"];
    name: string;
};

const AddressSelectInput: React.FC<IAddressSelectInput> =
    ({
         addresses,
         name,
     }) => {
        const classes = useStyles();
        const [field, meta, helpers] = useField(name);

        return (
            <div className={classes.root}>
                <SelectInput
                    label="Select a destination account"
                    options={addresses}
                    onChange={(address) => {
                        helpers.setValue(address);
                    }}
                    placeholder="Select a destination account"
                />
            </div>
        );
    };

export default AddressSelectInput;
